import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import mqtt, { type MqttClient } from 'mqtt'

const CHAT_STORAGE_KEY = 'abracadabra.community.chat.real.v1'
const BROADCAST_CHANNEL_NAME = 'abracadabra_real_community_channel'

const TOPIC_CHAT = 'abracadabra/v1/live/chat'
const TOPIC_PRESENCE = 'abracadabra/v1/live/presence'

const BROKER_PRIMARY = 'wss://broker.emqx.io:8084/mqtt'
const BROKER_FALLBACK = 'wss://broker.hivemq.com:8884/mqtt'

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-system-welcome',
    senderId: 'system',
    senderName: 'Assistente da Comunidade',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AbracadabraLive',
    text: '👋 Olá! Esta é a sala de aula ao vivo da turma Abracadabra. Qualquer pessoa real que estiver navegando no site agora aparecerá na coluna de Alunos Conectados. Conversem, tirem dúvidas e compartilhem aprendizados sobre Web3!',
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
    const sliced = messages.slice(-80)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sliced))
  }
}

export interface RealtimeChatCallbacks {
  onPresenceUpdate: (peers: OnlineStudent[]) => void
  onMessageReceived: (messages: ChatMessage[]) => void
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

  const sessionId = `client_${currentUser.id}_${Math.random().toString(36).slice(2, 7)}`

  function buildStudentPayload(): OnlineStudent {
    const cleanAddr = currentUser.walletAddress || `Devnet${currentUser.id.slice(0, 10)}`
    return {
      id: currentUser.id,
      name: currentUser.displayName,
      role: `${currentUser.level || 'Aprendiz Web3'}`,
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

    if (mqttClient?.connected) {
      mqttClient.publish(TOPIC_PRESENCE, payload)
    }

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

        mqttClient?.subscribe([TOPIC_CHAT, TOPIC_PRESENCE], (err) => {
          if (!err) {
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
          }
        } catch {
          // ignore
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

  connectBroker(BROKER_PRIMARY)

  broadcastHeartbeat()
  presenceTimer = setInterval(broadcastHeartbeat, 6000)

  pruneTimer = setInterval(() => {
    if (mqttClient?.connected) {
      mqttClient.publish(
        TOPIC_PRESENCE,
        JSON.stringify({ type: 'ping', senderId: currentUser.id, sessionId })
      )
    }
  }, 18000)

  const handleBeforeUnload = () => {
    broadcastLeave()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

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

  if (mqttClient?.connected) {
    mqttClient.publish(TOPIC_CHAT, JSON.stringify(newMsg))
  }

  const bChannel = getBroadcastChannel()
  bChannel?.postMessage({ type: 'new_chat_msg', chatMessage: newMsg })

  return updated
}
