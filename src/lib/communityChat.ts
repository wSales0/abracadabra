import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import mqtt, { type MqttClient } from 'mqtt'

const CHAT_STORAGE_KEY = 'abracadabra.community.chat.real.v1'
const BROADCAST_CHANNEL_NAME = 'abracadabra_real_community_channel'

const TOPIC_CHAT = 'abracadabra/v1/live/chat'
const TOPIC_PRESENCE = 'abracadabra/v1/live/presence'

const BROKER_PRIMARY = 'wss://broker.emqx.io:8084/mqtt'
const BROKER_FALLBACK = 'wss://broker.hivemq.com:8884/mqtt'

const HEARTBEAT_INTERVAL_MS = 2000 // Pulso a cada 2 segundos para resposta ultra-rápida
const PEER_TIMEOUT_MS = 5000 // Remove colega se passar 5 segundos sem sinal
const SWEEP_INTERVAL_MS = 1000 // Varredura a cada 1 segundo

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
const currentActivePeers = new Map<string, OnlineStudent>()
const peerLastSeen = new Map<string, number>()

let presenceTimer: any = null
let sweepTimer: any = null
let burstTimer1: any = null
let burstTimer2: any = null

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
 * Inicia conexão em tempo real MQTT e presença ultra-rápida de usuários reais
 */
export function initCommunityRealtime(
  currentUser: UserProfile,
  callbacks: RealtimeChatCallbacks
): { cleanup: () => void; refresh: () => void } {
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

  function pingOthers() {
    if (isCleanedUp) return
    const payload = JSON.stringify({
      type: 'ping',
      sessionId,
      senderId: currentUser.id,
    })

    if (mqttClient?.connected) {
      mqttClient.publish(TOPIC_PRESENCE, payload)
    }

    bChannel?.postMessage({
      type: 'peer_ping',
      sessionId,
      senderId: currentUser.id,
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
        connectTimeout: 4000,
        reconnectPeriod: 3000,
        // Last Will and Testament: o servidor broker dispara automaticamente o leave se o navegador fechar ou cair
        will: {
          topic: TOPIC_PRESENCE,
          payload: JSON.stringify({
            type: 'leave',
            sessionId,
            userId: currentUser.id,
          }),
          qos: 0,
          retain: false,
        },
      })

      mqttClient.on('connect', () => {
        if (isCleanedUp) return
        callbacks.onStatusChange?.('connected')

        mqttClient?.subscribe([TOPIC_CHAT, TOPIC_PRESENCE], (err) => {
          if (!err) {
            broadcastHeartbeat()
            pingOthers()
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
      // Ignora eventos gerados por esta mesma sessão
      if (data.sessionId === sessionId || data.user.id === currentUser.id) return

      const peer: OnlineStudent = {
        ...data.user,
        isCurrentUser: false,
      }

      currentActivePeers.set(data.user.id, peer)
      peerLastSeen.set(data.user.id, Date.now())
      emitPresence()
    } else if (data.type === 'ping') {
      if (data.sessionId !== sessionId && data.senderId !== currentUser.id) {
        broadcastHeartbeat()
      }
    } else if (data.type === 'leave') {
      if (data.userId && data.userId !== currentUser.id) {
        currentActivePeers.delete(data.userId)
        peerLastSeen.delete(data.userId)
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
      peerLastSeen.set(msg.user.id, Date.now())
      emitPresence()
    } else if (msg.type === 'peer_ping' && msg.sessionId !== sessionId) {
      broadcastHeartbeat()
    } else if (msg.type === 'peer_leave' && msg.userId) {
      currentActivePeers.delete(msg.userId)
      peerLastSeen.delete(msg.userId)
      emitPresence()
    } else if (msg.type === 'new_chat_msg' && msg.chatMessage) {
      handleChatMessage(msg.chatMessage)
    }
  }

  bChannel?.addEventListener('message', handleBcMessage)

  connectBroker(BROKER_PRIMARY)

  // Pulso inicial imediato e rajada rápida para descoberta instantânea
  broadcastHeartbeat()
  pingOthers()
  burstTimer1 = setTimeout(() => {
    broadcastHeartbeat()
    pingOthers()
  }, 400)
  burstTimer2 = setTimeout(() => {
    broadcastHeartbeat()
    pingOthers()
  }, 1000)

  // Pulso contínuo a cada 2 segundos
  presenceTimer = setInterval(broadcastHeartbeat, HEARTBEAT_INTERVAL_MS)

  // Varredura de inatividade a cada 1 segundo: remove imediatamente quem passou 5 segundos sem enviar sinal
  sweepTimer = setInterval(() => {
    const now = Date.now()
    let hasChanged = false

    for (const [id, lastTime] of peerLastSeen.entries()) {
      if (now - lastTime > PEER_TIMEOUT_MS) {
        currentActivePeers.delete(id)
        peerLastSeen.delete(id)
        hasChanged = true
      }
    }

    if (hasChanged) {
      emitPresence()
    }
  }, SWEEP_INTERVAL_MS)

  // Sair rapidamente em pagehide / beforeunload / visibilitychange
  const handleUnload = () => {
    broadcastLeave()
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      broadcastHeartbeat()
      pingOthers()
    } else if (document.visibilityState === 'hidden') {
      // Também avisa ao trocar ou ocultar a aba se necessário
      broadcastHeartbeat()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
    document.addEventListener('visibilitychange', handleVisibility)
  }

  function manualRefresh() {
    broadcastHeartbeat()
    pingOthers()
  }

  return {
    refresh: manualRefresh,
    cleanup: () => {
      isCleanedUp = true
      clearInterval(presenceTimer)
      clearInterval(sweepTimer)
      clearTimeout(burstTimer1)
      clearTimeout(burstTimer2)
      broadcastLeave()
      bChannel?.removeEventListener('message', handleBcMessage)
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleUnload)
        window.removeEventListener('pagehide', handleUnload)
        document.removeEventListener('visibilitychange', handleVisibility)
      }
      mqttClient?.end(true)
      mqttClient = null
      currentActivePeers.clear()
      peerLastSeen.clear()
    },
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
