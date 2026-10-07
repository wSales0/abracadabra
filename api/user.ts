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
    const usersCol = db.collection('users')

    if (req.method === 'GET') {
      const action = req.query.action as string
      if (action === 'presence') {
        const currentUserId = (req.query.currentUserId as string) || ''
        const threshold = new Date(Date.now() - 45000)
        const onlineDocs = await usersCol
          .find({
            lastSeen: { $gte: threshold },
            id: { $ne: currentUserId }
          })
          .sort({ lastSeen: -1 })
          .limit(30)
          .toArray()

        const peers = onlineDocs.map((u) => ({
          id: u.id,
          name: u.displayName || u.username || 'Aluno',
          role: u.level || 'Explorador',
          avatarUrl: u.avatarUrl || '',
          walletAddress: u.walletAddress || '',
          status: 'online',
          xp: u.xp || 100,
          isCurrentUser: false,
          lastSeen: u.lastSeen,
        }))

        return res.status(200).json(peers)
      }

      const id = req.query.id as string
      const email = req.query.email as string
      const username = req.query.username as string
      const wallet = req.query.wallet as string

      let filter: any = null
      if (id) filter = { id }
      else if (email) filter = { email }
      else if (username) filter = { username }
      else if (wallet) filter = { walletAddress: wallet }

      if (!filter) {
        return res.status(400).json({ error: 'Parâmetro id, email, username ou wallet é obrigatório' })
      }

      const user = await usersCol.findOne(filter)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      return res.status(200).json(user)
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const action = req.query.action as string

      if (action === 'presence') {
        const { userId, name, walletAddress, avatarUrl, level, xp } = req.body || {}
        if (userId) {
          await usersCol.updateOne(
            { id: userId },
            {
              $set: {
                ...(name ? { displayName: name } : {}),
                ...(walletAddress ? { walletAddress } : {}),
                ...(avatarUrl ? { avatarUrl } : {}),
                ...(level ? { level } : {}),
                ...(typeof xp === 'number' ? { xp } : {}),
                lastSeen: new Date(),
                updatedAt: new Date(),
              }
            },
            { upsert: true }
          )
        }

        const threshold = new Date(Date.now() - 45000)
        const onlineDocs = await usersCol
          .find({
            lastSeen: { $gte: threshold },
            id: { $ne: userId || '' }
          })
          .sort({ lastSeen: -1 })
          .limit(30)
          .toArray()

        const peers = onlineDocs.map((u) => ({
          id: u.id,
          name: u.displayName || u.username || 'Aluno',
          role: u.level || 'Explorador',
          avatarUrl: u.avatarUrl || '',
          walletAddress: u.walletAddress || '',
          status: 'online',
          xp: u.xp || 100,
          isCurrentUser: false,
          lastSeen: u.lastSeen,
        }))

        return res.status(200).json({ success: true, peers })
      }

      if (action === 'transfer') {
        const { recipientAddress, amount, senderName, signature } = req.body || {}
        if (!recipientAddress || !amount || Number(amount) <= 0) {
          return res.status(400).json({ error: 'Dados de transferência inválidos' })
        }

        const numAmount = Number(amount)
        const cleanRecipient = String(recipientAddress).trim()
        const safeEscaped = cleanRecipient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const recipientDoc = await usersCol.findOne({
          $or: [
            { walletAddress: cleanRecipient },
            { walletAddress: { $regex: new RegExp(`^${safeEscaped}$`, 'i') } },
            { id: cleanRecipient },
            { username: cleanRecipient },
            { email: cleanRecipient }
          ]
        })

        if (recipientDoc) {
          const currentBalance = typeof recipientDoc.practiceBalance === 'number' ? recipientDoc.practiceBalance : 2.5
          const newBalance = Number((currentBalance + numAmount).toFixed(6))
          const rxTx = {
            id: `tx-recv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'receive',
            amount: numAmount,
            signature: signature || `sig-${Date.now()}`,
            toOrFrom: `Recebido de ${senderName || 'Colega'}`,
            timestamp: new Date().toISOString(),
            status: 'confirmada',
            fee: 0,
          }

          await usersCol.updateOne(
            { _id: recipientDoc._id },
            {
              $set: {
                practiceBalance: newBalance,
                unreadTransfer: {
                  id: `transfer-${Date.now()}`,
                  senderName: senderName || 'Colega',
                  amount: numAmount,
                  signature: signature || '',
                  timestamp: new Date().toISOString(),
                },
                updatedAt: new Date(),
              },
              $push: {
                practiceTransactions: {
                  $each: [rxTx],
                  $position: 0,
                },
              },
            }
          )

          return res.status(200).json({ success: true, credited: true })
        }

        return res.status(200).json({ success: true, credited: false, note: 'Destinatário ainda não registrado no banco' })
      }

      if (action === 'clear_unread_transfer') {
        const { userId } = req.body || {}
        if (userId) {
          const cleanId = String(userId).trim()
          await usersCol.updateOne(
            {
              $or: [
                { id: cleanId },
                { walletAddress: cleanId },
                { username: cleanId }
              ]
            },
            { $unset: { unreadTransfer: '' } }
          )
        }
        return res.status(200).json({ success: true })
      }

      const user = req.body
      if (!user || !user.id) {
        return res.status(400).json({ error: 'Dados do usuário ou id ausentes' })
      }

      const { _id, ...safeUserData } = user
      const result = await usersCol.findOneAndUpdate(
        { id: user.id },
        {
          $set: {
            ...safeUserData,
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      )

      return res.status(200).json({ success: true, user: result })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error: any) {
    console.error('API /api/user error:', error)
    return res.status(500).json({ error: error.message || 'Erro interno no banco de dados' })
  }
}
