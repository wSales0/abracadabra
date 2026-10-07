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
