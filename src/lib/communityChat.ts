import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import { generateMockSignature, sendPracticeSol } from './practiceWallet'

const CHAT_STORAGE_KEY = 'abracadabra.community.chat.v1'
const BROADCAST_CHANNEL_NAME = 'abracadabra_community_channel'

export const CLASSMATE_STUDENTS: OnlineStudent[] = [
  {
    id: 'student_ana',
    name: 'Ana',
    role: 'Aluna iniciante em Web3 (22 anos)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AnaWeb3',
    walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    status: 'online',
    xp: 140,
  },
  {
    id: 'student_sonia',
    name: 'Dona Sônia',
    role: 'Aposentada & Exploradora Digital (67 anos)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SoniaDigital',
    walletAddress: '3sXNtg2BW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs8',
    status: 'estudando',
    xp: 220,
  },
  {
    id: 'student_lucas',
    name: 'Lucas',
    role: 'Estudante de Programação (19 anos)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=LucasDev',
    walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    status: 'online',
    xp: 380,
  },
  {
    id: 'student_marcos',
    name: 'Prof. Marcos',
    role: 'Tutor da Comunidade Web3',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProfMarcos',
    walletAddress: '4Nd1mBQtrMJVYVfKf2PJy9NZWMdBcD9Gz8LqKsVzT1mB',
    status: 'online',
    xp: 950,
  },
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    senderId: 'student_marcos',
    senderName: 'Prof. Marcos',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProfMarcos',
    text: 'Olá a todos! Sejam bem-vindos à sala da turma Abracadabra! Aqui vocês podem tirar dúvidas sobre Web3 e praticar transferir SOL de teste entre si.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-init-2',
    senderId: 'student_sonia',
    senderName: 'Dona Sônia',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SoniaDigital',
    text: 'Boa tarde pessoal! Estou adorando o Tradutor do Cotidiano. Finalmente entendi que a Chave Pública é como a nossa Chave Pix!',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg-init-3',
    senderId: 'student_ana',
    senderName: 'Ana',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AnaWeb3',
    text: 'Oi turma! Quem puder mandar um trocadinho de 0.05 SOL de teste para minha carteira para eu ver como chega a transação, agradeço muito! 🚀',
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
]

let broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    }
    return broadcastChannel
  }
  return null
}

export function getChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_MESSAGES
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES))
      return INITIAL_MESSAGES
    }
    return JSON.parse(stored)
  } catch {
    return INITIAL_MESSAGES
  }
}

function saveChatMessages(messages: ChatMessage[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    const channel = getBroadcastChannel()
    channel?.postMessage({ type: 'sync_messages', messages })
  }
}

export function subscribeToChat(onNewMessages: (messages: ChatMessage[]) => void): () => void {
  const channel = getBroadcastChannel()

  const handleChannelMsg = (event: MessageEvent) => {
    if (event.data?.type === 'sync_messages' && Array.isArray(event.data.messages)) {
      onNewMessages(event.data.messages)
    }
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === CHAT_STORAGE_KEY && event.newValue) {
      try {
        onNewMessages(JSON.parse(event.newValue))
      } catch {
        // noop
      }
    }
  }

  channel?.addEventListener('message', handleChannelMsg)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent)
  }

  return () => {
    channel?.removeEventListener('message', handleChannelMsg)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent)
    }
  }
}

export function sendChatMessage(user: UserProfile, text: string): ChatMessage[] {
  const current = getChatMessages()
  const cleanText = text.trim()
  if (!cleanText) return current

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
    text: cleanText,
    timestamp: new Date().toISOString(),
  }

  const updated = [...current, newMsg]
  saveChatMessages(updated)

  // Resposta simulada inteligente e carinhosa de um colega após 1.5 a 3 segundos
  triggerClassmateReaction(user, cleanText)

  return updated
}

export function sendCryptoTransferInChat(
  user: UserProfile,
  recipient: OnlineStudent,
  amount: number
): { success: boolean; error?: string; updatedUser?: UserProfile; messages?: ChatMessage[] } {
  // Executa o envio na carteira de treino do usuário
  const sendRes = sendPracticeSol(user, recipient.walletAddress, amount)
  if (!sendRes.success || !sendRes.updatedUser || !sendRes.transaction) {
    return { success: false, error: sendRes.error }
  }

  const current = getChatMessages()
  const transferMsg: ChatMessage = {
    id: `msg-tx-${Date.now()}`,
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
    text: `Transferiu ${amount.toFixed(4)} SOL de teste para ${recipient.name}!`,
    timestamp: new Date().toISOString(),
    transfer: {
      amount,
      signature: sendRes.transaction.signature,
      recipientName: recipient.name,
      recipientAddress: recipient.walletAddress,
    },
  }

  const updatedMessages = [...current, transferMsg]
  saveChatMessages(updatedMessages)

  // Resposta automática de agradecimento do colega que recebeu as moedas
  setTimeout(() => {
    const afterTransfer = getChatMessages()
    const reply: ChatMessage = {
      id: `msg-reply-${Date.now()}`,
      senderId: recipient.id,
      senderName: recipient.name,
      senderAvatar: recipient.avatarUrl,
      text: `Muito obrigada(o), @${user.displayName.split(' ')[0]}! Os ${amount.toFixed(4)} SOL já caíram certinho na minha carteira de teste! 🟢✨`,
      timestamp: new Date().toISOString(),
    }
    saveChatMessages([...afterTransfer, reply])
  }, 1800)

  return {
    success: true,
    updatedUser: sendRes.updatedUser,
    messages: updatedMessages,
  }
}

function triggerClassmateReaction(user: UserProfile, text: string) {
  const lower = text.toLowerCase()
  let replyText = ''
  let classmate: OnlineStudent = CLASSMATE_STUDENTS[0] // Ana

  if (lower.includes('ola') || lower.includes('olá') || lower.includes('oi') || lower.includes('boa tarde') || lower.includes('bom dia')) {
    replyText = `Oi, @${user.displayName.split(' ')[0]}! Muito bom te ver por aqui na turma. O que você está achando dos desafios?`
    classmate = CLASSMATE_STUDENTS[1] // Dona Sônia
  } else if (lower.includes('sol') || lower.includes('faucet') || lower.includes('carteira') || lower.includes('pix')) {
    replyText = `Essa parte da carteira de teste e da Chave Pix Cripto é fantástica! Você já testou enviar alguma moeda de treino pelo chat?`
    classmate = CLASSMATE_STUDENTS[2] // Lucas
  } else if (lower.includes('duvida') || lower.includes('dúvida') || lower.includes('ajuda') || lower.includes('como funciona')) {
    replyText = `Pode mandar sua dúvida aqui, @${user.displayName.split(' ')[0]}! Lembre-se que na Web3 você só compartilha a Chave Pública, a Privada nunca!`
    classmate = CLASSMATE_STUDENTS[3] // Prof. Marcos
  }

  if (replyText) {
    setTimeout(() => {
      const messages = getChatMessages()
      const botMsg: ChatMessage = {
        id: `msg-auto-${Date.now()}`,
        senderId: classmate.id,
        senderName: classmate.name,
        senderAvatar: classmate.avatarUrl,
        text: replyText,
        timestamp: new Date().toISOString(),
      }
      saveChatMessages([...messages, botMsg])
    }, 2200)
  }
}
