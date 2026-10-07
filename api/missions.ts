import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from './_lib/mongodb.ts'

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
    const missionsCol = db.collection('missions')

    if (req.method === 'GET') {
      const userId = req.query.userId as string
      if (!userId) {
        return res.status(400).json({ error: 'Parâmetro userId é obrigatório' })
      }

      const doc = await missionsCol.findOne({ userId })
      return res.status(200).json({
        userId,
        completedMissions: doc?.completedMissions || [],
      })
    }

    if (req.method === 'POST') {
      const { userId, missionId, completedMissions } = req.body || {}
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' })
      }

      if (Array.isArray(completedMissions)) {
        await missionsCol.updateOne(
          { userId },
          {
            $set: {
              completedMissions,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        )
        return res.status(200).json({ success: true, completedMissions })
      }

      if (missionId) {
        const updated = await missionsCol.findOneAndUpdate(
          { userId },
          {
            $addToSet: { completedMissions: missionId },
            $set: { updatedAt: new Date() },
          },
          { upsert: true, returnDocument: 'after' }
        )
        return res.status(200).json({
          success: true,
          completedMissions: updated?.completedMissions || [missionId],
        })
      }

      return res.status(400).json({ error: 'missionId ou completedMissions ausente' })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error: any) {
    console.error('API /api/missions error:', error)
    return res.status(500).json({ error: error.message || 'Erro interno no banco de dados' })
  }
}
