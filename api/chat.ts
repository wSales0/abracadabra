import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from './_lib/mongodb'

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
