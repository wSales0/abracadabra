import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import { receivePracticeSol, sendPracticeSol } from './practiceWallet'
import mqtt, { type MqttClient } from 'mqtt'

const CHAT_STORAGE_KEY = 'abracadabra.community.chat.real.v1'
const BROADCAST_CHANNEL_NAME = 'abracadabra_real_community_channel'

const TOPIC_CHAT = 'abracadabra/v1/live/chat'
const TOPIC_PRESENCE = 'abracadabra/v1/live/presence'
const TOPIC_TRANSFERS = 'abracadabra/v1/live/transfers'

const BROKER_PRIMARY = 'wss://broker.emqx.io:8084/mqtt'
const BROKER_FALLBACK = 'wss://broker.hivemq.com:8884/mqtt'

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-system-welcome',
    senderId: 'system',
    senderName: 'Assistente da Comunidade',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AbracadabraLive',
    text: '👋 Olá! Esta é a sala de aula ao vivo da turma Abracadabra. Qualquer pessoa real que estiver navegando no site agora aparecerá na coluna de Alunos Conectados. Conversem, tirem dúvidas e pratiquem transferir moedas de teste entre si!',
    timestamp: new Date().toISOString(),
  },
]

let mqttClient: MqttClient | null = null
let broadcastChannel: BroadcastChannel | null = null
let currentActivePeers = new Map<string, OnlineStudent>()
let presenceTimer: any = null
let pruneTimer: any = null

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

function saveChatMessagesLocally(messages: ChatMessage[]) {
  if (typeof window !== 'undefined') {
    // Mantém no máximo 80 mensagens para não poluir o armazenamento
    const sliced = messages.slice(-80)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sliced))
  }
}

export interface RealtimeChatCallbacks {
  onPresenceUpdate: (peers: OnlineStudent[]) => void
  onMessageReceived: (messages: ChatMessage[]) => void
  onCryptoReceived?: (notice: string, updatedUser: UserProfile) => void
  onStatusChange?: (status: 'connected' | 'connecting' | 'offline') => void
}

/**
 * Inicia conexão em tempo real MQTT e presença de usuários reais
 */
export function initCommunityRealtime(
  currentUser: UserProfile,
  callbacks: RealtimeChatCallbacks
): () => void {
  const bChannel = getBroadcastChannel()
  let isCleanedUp = false

  callbacks.onStatusChange?.('connecting')

  // Identificador da sessão deste navegador
  const sessionId = `client_${currentUser.id}_${Math.random().toString(36).slice(2, 7)}`

  function buildStudentPayload(): OnlineStudent {
    const cleanAddr = currentUser.walletAddress || `Devnet${currentUser.id.slice(0, 10)}`
    return {
      id: currentUser.id,
      name: currentUser.displayName,
      role: `${currentUser.level || 'Aprendiz Web3'} · ${(currentUser.practiceBalance ?? 2.5).toFixed(2)} SOL`,
      avatarUrl: currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
      walletAddress: cleanAddr,
      status: 'online',
      xp: currentUser.xp || 100,
      isCurrentUser: false,
    }
  }

  function emitPresence() {
    const list = Array.from(currentActivePeers.values())
    callbacks.onPresenceUpdate(list)
  }

  function broadcastHeartbeat() {
    if (isCleanedUp) return
    const payload = JSON.stringify({
      type: 'heartbeat',
      sessionId,
      user: buildStudentPayload(),
      timestamp: Date.now(),
    })

    // Envia no MQTT
    if (mqttClient?.connected) {
      mqttClient.publish(TOPIC_PRESENCE, payload)
    }

    // Envia no BroadcastChannel (para outras abas do mesmo computador)
    bChannel?.postMessage({
      type: 'peer_heartbeat',
      sessionId,
      user: buildStudentPayload(),
      timestamp: Date.now(),
    })
  }

  function broadcastLeave() {
    const payload = JSON.stringify({
      type: 'leave',
      sessionId,
      userId: currentUser.id,
    })
    if (mqttClient?.connected) {
      mqttClient.publish(TOPIC_PRESENCE, payload)
    }
    bChannel?.postMessage({
      type: 'peer_leave',
      sessionId,
      userId: currentUser.id,
    })
  }

  // Cria cliente MQTT com fallback de broker
  function connectBroker(brokerUrl: string) {
    if (isCleanedUp) return

    try {
      mqttClient = mqtt.connect(brokerUrl, {
        clientId: sessionId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
      })

      mqttClient.on('connect', () => {
        if (isCleanedUp) return
        callbacks.onStatusChange?.('connected')

        mqttClient?.subscribe([TOPIC_CHAT, TOPIC_PRESENCE, TOPIC_TRANSFERS], (err) => {
          if (!err) {
            // Avisa a todos que chegou e pede presença dos outros
            broadcastHeartbeat()
            mqttClient?.publish(
              TOPIC_PRESENCE,
              JSON.stringify({ type: 'ping', senderId: currentUser.id, sessionId })
            )
          }
        })
      })

      mqttClient.on('message', (topic, raw) => {
        if (isCleanedUp) return
        try {
          const data = JSON.parse(raw.toString())

          if (topic === TOPIC_PRESENCE) {
            handlePresenceMessage(data)
          } else if (topic === TOPIC_CHAT) {
            handleChatMessage(data)
          } else if (topic === TOPIC_TRANSFERS) {
            handleTransferMessage(data)
          }
        } catch {
          // ignore corrupted payload
        }
      })

      mqttClient.on('error', () => {
        callbacks.onStatusChange?.('offline')
        if (brokerUrl === BROKER_PRIMARY && !isCleanedUp) {
          mqttClient?.end(true)
          connectBroker(BROKER_FALLBACK)
        }
      })

      mqttClient.on('close', () => {
        callbacks.onStatusChange?.('connecting')
      })
    } catch {
      callbacks.onStatusChange?.('offline')
    }
  }

  function handlePresenceMessage(data: any) {
    if (!data) return

    if (data.type === 'heartbeat' && data.user) {
      // Ignora se for do mesmo usuário na mesma sessão
      if (data.sessionId === sessionId || data.user.id === currentUser.id) return

      const peer: OnlineStudent = {
        ...data.user,
        isCurrentUser: false,
      }
      currentActivePeers.set(data.user.id, peer)
      emitPresence()
    } else if (data.type === 'ping') {
      if (data.sessionId !== sessionId) {
        broadcastHeartbeat()
      }
    } else if (data.type === 'leave') {
      if (data.userId && data.userId !== currentUser.id) {
        currentActivePeers.delete(data.userId)
        emitPresence()
      }
    }
  }

  function handleChatMessage(data: any) {
    if (!data || !data.id) return
    const currentList = getChatMessages()
    if (!currentList.some((m) => m.id === data.id)) {
      const updated = [...currentList, data]
      saveChatMessagesLocally(updated)
      callbacks.onMessageReceived(updated)
    }
  }

  function handleTransferMessage(data: any) {
    if (!data) return

    // Se a transferência foi destinada ao usuário desta máquina:
    if (data.recipientId === currentUser.id && data.amount > 0) {
      const res = receivePracticeSol(currentUser, data.senderName, data.amount, data.signature)
      const notice = `🎉 Você acabou de receber +${data.amount.toFixed(4)} SOL de ${data.senderName} ao vivo no chat!`
      callbacks.onCryptoReceived?.(notice, res.updatedUser)
    }
  }

  // Escuta no BroadcastChannel (comunicação instantânea multi-abas)
  const handleBcMessage = (event: MessageEvent) => {
    if (isCleanedUp || !event.data) return
    const msg = event.data

    if (msg.type === 'peer_heartbeat' && msg.user && msg.sessionId !== sessionId) {
      currentActivePeers.set(msg.user.id, msg.user)
      emitPresence()
    } else if (msg.type === 'peer_leave' && msg.userId) {
      currentActivePeers.delete(msg.userId)
      emitPresence()
    } else if (msg.type === 'new_chat_msg' && msg.chatMessage) {
      handleChatMessage(msg.chatMessage)
    }
  }

  bChannel?.addEventListener('message', handleBcMessage)

  // Inicia conexão MQTT
  connectBroker(BROKER_PRIMARY)

  // Dispara heartbeat inicial e a cada 6 segundos
  broadcastHeartbeat()
  presenceTimer = setInterval(broadcastHeartbeat, 6000)

  // Limpa peers inativos há mais de 16 segundos
  pruneTimer = setInterval(() => {
    // Para simplificar, a cada 18s re-pinga se a lista tiver membros
    if (mqttClient?.connected) {
      mqttClient.publish(
        TOPIC_PRESENCE,
        JSON.stringify({ type: 'ping', senderId: currentUser.id, sessionId })
      )
    }
  }, 18000)

  // Trata saída do usuário ao fechar a janela
  const handleBeforeUnload = () => {
    broadcastLeave()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  // Retorna função de limpeza (unsubscribe / disconnect)
  return () => {
    isCleanedUp = true
    clearInterval(presenceTimer)
    clearInterval(pruneTimer)
    broadcastLeave()
    bChannel?.removeEventListener('message', handleBcMessage)
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    mqttClient?.end(true)
    mqttClient = null
    currentActivePeers.clear()
  }
}

/**
 * Envia uma mensagem no chat da comunidade para todos os alunos online
 */
export function sendChatMessage(user: UserProfile, text: string): ChatMessage[] {
  const current = getChatMessages()
  const cleanText = text.trim()
  if (!cleanText) return current

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
    text: cleanText,
    timestamp: new Date().toISOString(),
  }

  const updated = [...current, newMsg]
  saveChatMessagesLocally(updated)

  // Publica no MQTT para todos os outros navegadores no mundo
  if (mqttClient?.connected) {
    mqttClient.publish(TOPIC_CHAT, JSON.stringify(newMsg))
  }

  // Publica no BroadcastChannel para outras abas locais
  const bChannel = getBroadcastChannel()
  bChannel?.postMessage({ type: 'new_chat_msg', chatMessage: newMsg })

  return updated
}

/**
 * Envia moedas (SOL de prática) de um usuário real para outro usuário real
 */
export function sendCryptoTransferInChat(
  user: UserProfile,
  recipient: OnlineStudent,
  amount: number
): { success: boolean; error?: string; updatedUser?: UserProfile; messages?: ChatMessage[] } {
  // Executa o débito da carteira local do remetente
  const sendRes = sendPracticeSol(user, recipient.walletAddress, amount)
  if (!sendRes.success || !sendRes.updatedUser || !sendRes.transaction) {
    return { success: false, error: sendRes.error }
  }

  const current = getChatMessages()
  const transferMsg: ChatMessage = {
    id: `msg-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
  saveChatMessagesLocally(updatedMessages)

  const payload = {
    type: 'crypto_transfer',
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatarUrl,
    senderAddress: user.walletAddress,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientAddress: recipient.walletAddress,
    amount,
    signature: sendRes.transaction.signature,
    timestamp: transferMsg.timestamp,
  }

  // Envia no tópico de transferências e no chat
  if (mqttClient?.connected) {
    mqttClient.publish(TOPIC_TRANSFERS, JSON.stringify(payload))
    mqttClient.publish(TOPIC_CHAT, JSON.stringify(transferMsg))
  }

  const bChannel = getBroadcastChannel()
  bChannel?.postMessage({ type: 'new_chat_msg', chatMessage: transferMsg })

  return {
    success: true,
    updatedUser: sendRes.updatedUser,
    messages: updatedMessages,
  }
}
