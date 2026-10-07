import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from './_lib/mongodb'

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
      const id = req.query.id as string
      const email = req.query.email as string
      const username = req.query.username as string

      let filter: any = null
      if (id) filter = { id }
      else if (email) filter = { email }
      else if (username) filter = { username }

      if (!filter) {
        return res.status(400).json({ error: 'Parâmetro id, email ou username é obrigatório' })
      }

      const user = await usersCol.findOne(filter)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      return res.status(200).json(user)
    }

    if (req.method === 'POST' || req.method === 'PUT') {
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
