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

const DEFAULT_WELCOME_MSG = {
  id: 'msg-system-welcome',
  senderId: 'system',
  senderName: 'Assistente da Comunidade',
  senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AbracadabraLive',
  text: '👋 Olá! Esta é a sala de aula ao vivo da turma Abracadabra. Qualquer pessoa real que estiver navegando no site agora aparecerá na coluna de Alunos Conectados. Conversem, tirem dúvidas e compartilhem aprendizados sobre Web3!',
  timestamp: new Date().toISOString(),
  createdAt: new Date(),
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
    const messagesCol = db.collection('messages')

    if (req.method === 'GET') {
      const messages = await messagesCol
        .find({})
        .sort({ timestamp: -1 })
        .limit(80)
        .toArray()

      if (messages.length === 0) {
        await messagesCol.insertOne(DEFAULT_WELCOME_MSG)
        const { _id, ...safe } = DEFAULT_WELCOME_MSG
        return res.status(200).json([safe])
      }

      // Reordena em ordem cronológica (mais antigo primeiro)
      const chronologic = messages.reverse().map(({ _id, ...item }) => item)
      return res.status(200).json(chronologic)
    }

    if (req.method === 'POST') {
      const msg = req.body
      if (!msg || !msg.text) {
        return res.status(400).json({ error: 'Mensagem inválida ou texto ausente' })
      }

      const document = {
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderId: msg.senderId || 'anon',
        senderName: msg.senderName || 'Aluno',
        senderAvatar: msg.senderAvatar || '',
        text: String(msg.text).trim(),
        timestamp: msg.timestamp || new Date().toISOString(),
        createdAt: new Date(),
      }

      await messagesCol.insertOne(document)
      const { _id, ...safeMsg } = document

      return res.status(201).json({ success: true, message: safeMsg })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error: any) {
    console.error('API /api/chat error:', error)
    return res.status(500).json({ error: error.message || 'Erro interno no banco de dados' })
  }
}
