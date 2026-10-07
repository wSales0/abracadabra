import type { ChatMessage, LeaderboardUser, OnlineStudent, UserProfile } from '../types'

const BASE_API_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000'

/**
 * Salva ou atualiza o perfil do usuário diretamente no MongoDB
 */
export async function saveUserToMongo(user: UserProfile): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
    return res.ok
  } catch (err) {
    console.warn('MongoDB saveUser error (offline/fallback):', err)
    return false
  }
}

/**
 * Busca o perfil de um usuário no MongoDB pelo ID, email ou username
 */
export async function fetchUserFromMongo(idOrEmailOrUsername: string): Promise<UserProfile | null> {
  try {
    let param = `id=${encodeURIComponent(idOrEmailOrUsername)}`
    if (idOrEmailOrUsername.includes('@')) {
      param = `email=${encodeURIComponent(idOrEmailOrUsername)}`
    }

    const res = await fetch(`${BASE_API_URL}/api/user?${param}`)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('MongoDB fetchUser error:', err)
    return null
  }
}

/**
 * Busca o histórico de mensagens do chat persistidas no MongoDB
 */
export async function fetchChatMessagesFromMongo(): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/chat`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('MongoDB fetchChat error:', err)
    return []
  }
}

/**
 * Salva uma nova mensagem do chat no MongoDB
 */
export async function saveChatMessageToMongo(msg: ChatMessage): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    })
    return res.ok
  } catch (err) {
    console.warn('MongoDB saveChat error:', err)
    return false
  }
}

/**
 * Busca as missões concluídas de um usuário no MongoDB
 */
export async function fetchCompletedMissionsFromMongo(userId: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/missions?userId=${encodeURIComponent(userId)}`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.completedMissions) ? data.completedMissions : []
  } catch (err) {
    console.warn('MongoDB fetchMissions error:', err)
    return []
  }
}

/**
 * Registra uma missão concluída para o usuário no MongoDB
 */
export async function recordMissionToMongo(userId: string, missionId: string): Promise<string[] | null> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, missionId }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.completedMissions || null
  } catch (err) {
    console.warn('MongoDB recordMission error:', err)
    return null
  }
}

/**
 * Busca o progresso das atividades do laboratório no MongoDB
 */
export async function fetchActivityProgressFromMongo(userId: string): Promise<any | null> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/activities?userId=${encodeURIComponent(userId)}`)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('MongoDB fetchActivities error:', err)
    return null
  }
}

/**
 * Salva resposta e ganho de XP de atividade no MongoDB
 */
export async function recordAnswerToMongo(
  userId: string,
  answerData: {
    questionId: string
    isCorrect: boolean
    category?: string
    difficulty?: string
    xpEarned?: number
  }
): Promise<any | null> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...answerData }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.progress || null
  } catch (err) {
    console.warn('MongoDB recordAnswer error:', err)
    return null
  }
}

/**
 * Registra transferência de cripto diretamente para o destinatário no MongoDB
 */
export async function notifyRecipientTransferInMongo(
  recipientAddress: string,
  amount: number,
  senderName: string,
  signature: string
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user?action=transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientAddress,
        amount,
        senderName,
        signature,
      }),
    })
    return res.ok
  } catch (err) {
    console.warn('MongoDB transfer notify error:', err)
    return false
  }
}

/**
 * Limpa a notificação de cripto recebida do usuário no MongoDB
 */
export async function clearUnreadTransferInMongo(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user?action=clear_unread_transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    return res.ok
  } catch (err) {
    console.warn('MongoDB clearUnreadTransfer error:', err)
    return false
  }
}

/**
 * Busca a lista de colegas que estão com o site aberto em tempo real via MongoDB
 */
export async function fetchOnlinePeersFromMongo(currentUserId: string): Promise<OnlineStudent[]> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user?action=presence&currentUserId=${encodeURIComponent(currentUserId)}`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('MongoDB fetchOnlinePeers error:', err)
    return []
  }
}

/**
 * Registra a presença do aluno atual no MongoDB e retorna os colegas online imediatamente
 */
export async function pingPresenceInMongo(user: UserProfile): Promise<OnlineStudent[]> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user?action=presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: user.displayName,
        walletAddress: user.walletAddress,
        avatarUrl: user.avatarUrl,
        level: user.level,
        xp: user.xp,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.peers) ? data.peers : []
  } catch (err) {
    console.warn('MongoDB pingPresence error:', err)
    return []
  }
}

/**
 * Busca o ranking geral de alunos ordenado por XP a partir do MongoDB
 */
export async function fetchLeaderboardFromMongo(): Promise<LeaderboardUser[]> {
  try {
    const res = await fetch(`${BASE_API_URL}/api/user?action=leaderboard`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('MongoDB fetchLeaderboard error:', err)
    return []
  }
}
