import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient, type Db } from 'mongodb'

// Conexão direta com os shards da réplica no MongoDB Atlas (evita falhas de resolução DNS SRV em Windows, Vercel e redes corporativas)
const DIRECT_REPLICA_URI =
  'mongodb://rny:eWEcZsZhZXDeM0Yf@ac-vsip0zs-shard-00-00.mohf51x.mongodb.net:27017,ac-vsip0zs-shard-00-01.mohf51x.mongodb.net:27017,ac-vsip0zs-shard-00-02.mohf51x.mongodb.net:27017/abracadabra?ssl=true&replicaSet=atlas-8mfh9z-shard-0&authSource=admin&retryWrites=true&w=majority'

const PRIMARY_URI = process.env.MONGODB_URI || DIRECT_REPLICA_URI
const DB_NAME = process.env.MONGODB_DB || 'abracadabra'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 })
      return { client: cachedClient, db: cachedDb }
    } catch {
      cachedClient = null
      cachedDb = null
    }
  }

  try {
    const client = new MongoClient(PRIMARY_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })

    await client.connect()
    const db = client.db(DB_NAME)

    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (err: any) {
    console.warn('Conexão primária falhou, acionando rota direta de shards no Atlas:', err?.message)

    const fallbackClient = new MongoClient(DIRECT_REPLICA_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })

    await fallbackClient.connect()
    const fallbackDb = fallbackClient.db(DB_NAME)

    cachedClient = fallbackClient
    cachedDb = fallbackDb

    return { client: fallbackClient, db: fallbackDb }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { db } = await connectToDatabase()
    const activitiesCol = db.collection('activities')

    if (req.method === 'GET') {
      const userId = req.query.userId as string
      if (!userId) {
        return res.status(400).json({ error: 'Parâmetro userId é obrigatório' })
      }

      const doc = await activitiesCol.findOne({ userId })
      return res.status(200).json({
        userId,
        answeredCount: doc?.answeredCount || 0,
        totalCorrect: doc?.totalCorrect || 0,
        xpTotal: doc?.xpTotal || 0,
        history: doc?.history || [],
      })
    }

    if (req.method === 'POST') {
      const { userId, questionId, isCorrect, category, difficulty, xpEarned } = req.body || {}
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' })
      }

      const entry = {
        questionId: questionId || `q-${Date.now()}`,
        isCorrect: Boolean(isCorrect),
        category: category || 'conceito',
        difficulty: difficulty || 'iniciante',
        xpEarned: Number(xpEarned) || 0,
        answeredAt: new Date(),
      }

      const updated = await activitiesCol.findOneAndUpdate(
        { userId },
        {
          $inc: {
            answeredCount: 1,
            totalCorrect: isCorrect ? 1 : 0,
            xpTotal: Number(xpEarned) || 0,
          },
          $push: {
            history: {
              $each: [entry],
              $slice: -100, // guarda os últimos 100 registros
            },
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, returnDocument: 'after' }
      )

      return res.status(200).json({
        success: true,
        progress: {
          answeredCount: updated?.answeredCount || 1,
          totalCorrect: updated?.totalCorrect || (isCorrect ? 1 : 0),
          xpTotal: updated?.xpTotal || (Number(xpEarned) || 0),
        },
      })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error: any) {
    console.error('API /api/activities error:', error)
    return res.status(500).json({ error: error.message || 'Erro interno no banco de dados' })
  }
}
