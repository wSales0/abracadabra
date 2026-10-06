import { FormEvent, useEffect, useRef, useState } from 'react'
import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import {
  getChatMessages,
  initCommunityRealtime,
  sendChatMessage,
} from '../lib/communityChat'

interface CommunityChatPanelProps {
  user: UserProfile
  onTriggerMission: (missionId: string, msg?: string) => void
}

export function CommunityChatPanel({ user, onTriggerMission }: CommunityChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages())
  const [inputText, setInputText] = useState('')
  const [realOnlinePeers, setRealOnlinePeers] = useState<OnlineStudent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const presenceEngineRef = useRef<{ refresh: () => void; cleanup: () => void } | null>(null)

  useEffect(() => {
    // Inicializa comunicação em tempo real global (MQTT + BroadcastChannel)
    const instance = initCommunityRealtime(user, {
      onPresenceUpdate: (peers) => {
        setRealOnlinePeers(peers)
      },
      onMessageReceived: (updatedMessages) => {
        setMessages(updatedMessages)
      },
      onStatusChange: (status) => {
        setConnectionStatus(status)
      },
    })

    presenceEngineRef.current = instance

    return () => {
      instance.cleanup()
    }
  }, [user.id, user.displayName, user.avatarUrl])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!inputText.trim()) return
    const updated = sendChatMessage(user, inputText)
    setMessages(updated)
    setInputText('')
    onTriggerMission('mission_community_chat', '🎉 Parabéns! Você interagiu com a comunidade no chat ao vivo!')
  }

  function copyAddress(address: string, id: string) {
    navigator.clipboard.writeText(address)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  function handleCopyShareLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin)
      setCopiedShareLink(true)
      setTimeout(() => setCopiedShareLink(false), 2500)
    }
  }

  function formatTime(isoString: string) {
    try {
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString))
    } catch {
      return 'Agora'
    }
  }

  const totalOnlineCount = realOnlinePeers.length + 1

  return (
    <section className="community-chat-panel">
      <div className="community-header">
        <div>
          <div className="community-badge-row">
            <span
              className={`live-pulse-dot ${
                connectionStatus === 'connected' ? 'connected' : connectionStatus === 'connecting' ? 'connecting' : 'offline'
              }`}
            />
            <span className="community-online-count">
              {totalOnlineCount} {totalOnlineCount === 1 ? 'Pessoa Real Conectada' : 'Pessoas Reais Conectadas Agora'}
            </span>
            <span className="community-network-badge">
              {connectionStatus === 'connected'
                ? '🟢 Ao vivo via WebSockets'
                : connectionStatus === 'connecting'
                ? '🟡 Conectando à rede...'
                : '⚪ Modo local'}
            </span>
            <span className="community-safe-tag">🛡️ 100% Pessoas Reais</span>
          </div>
          <h1>Comunidade &amp; Chat da Turma</h1>
          <p className="panel-lead">
            Converse em tempo real com outros alunos navegando no site agora. Tire dúvidas, troque ideias e compartilhe
            experiências sobre Web3!
          </p>
        </div>
      </div>

      <div className="community-grid">
        {/* Coluna da Esquerda: Usuários Reais Conectados */}
        <div className="classmates-column">
          <div className="column-title-box">
            <div className="column-title-row">
              <h3>Alunos Conectados Agora</h3>
              <div className="column-actions-right">
                <button
                  type="button"
                  className="btn-sync-presence"
                  onClick={() => presenceEngineRef.current?.refresh()}
                  title="Atualizar presença agora"
                >
                  🔄
                </button>
                <span className="real-tag">100% Real</span>
              </div>
            </div>
            <small>Pessoas com o site aberto neste momento</small>
          </div>

          <div className="classmates-list">
            {/* O próprio usuário logado */}
            <div className="classmate-card is-self">
              <div className="classmate-avatar-wrap">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="classmate-avatar" />
                ) : (
                  <span className="classmate-letter">{user.displayName.slice(0, 1)}</span>
                )}
                <span className="status-dot online" />
              </div>
              <div className="classmate-info">
                <div className="classmate-name-row">
                  <strong>{user.displayName} (Você)</strong>
                  <span className="you-pill">Você</span>
                </div>
                <small className="classmate-role">{user.level || 'Aprendiz'}</small>
                <div className="classmate-addr-row">
                  <code>
                    {(user.walletAddress || 'DevnetAddress').slice(0, 4)}...
                    {(user.walletAddress || 'DevnetAddress').slice(-4)}
                  </code>
                  <button
                    type="button"
                    className="btn-copy-mini"
                    onClick={() => copyAddress(user.walletAddress || 'DevnetAddress', 'self')}
                    title="Copiar sua chave pública"
                  >
                    {copiedKey === 'self' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>

            {/* Outros usuários reais conectados */}
            {realOnlinePeers.map((student) => (
              <div key={student.id} className="classmate-card">
                <div className="classmate-avatar-wrap">
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} alt="" className="classmate-avatar" />
                  ) : (
                    <span className="classmate-letter">{student.name.slice(0, 1)}</span>
                  )}
                  <span className="status-dot online" />
                </div>
                <div className="classmate-info">
                  <div className="classmate-name-row">
                    <strong>{student.name}</strong>
                    <span className="xp-tag">+{student.xp} XP</span>
                  </div>
                  <small className="classmate-role">{student.role}</small>
                  <div className="classmate-addr-row">
                    <code>
                      {student.walletAddress.slice(0, 4)}...{student.walletAddress.slice(-4)}
                    </code>
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => copyAddress(student.walletAddress, student.id)}
                      title="Copiar Chave Pública"
                    >
                      {copiedKey === student.id ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Aviso quando não há outros colegas reais online */}
            {realOnlinePeers.length === 0 && (
              <div className="no-peers-box">
                <span className="no-peers-icon">📡</span>
                <h4>Você é o único aluno conectado agora</h4>
                <p>
                  Não há outros visitantes no momento. Para testar o chat ao vivo com outra pessoa real:
                </p>
                <div className="no-peers-steps">
                  <span>1. Abra o site em outra aba ou janela anônima</span>
                  <span>2. Ou acesse pelo celular no mesmo link</span>
                  <span>3. Ou compartilhe com um amigo</span>
                </div>
                <button type="button" className="btn-copy-site-link" onClick={handleCopyShareLink}>
                  {copiedShareLink ? '✓ Link copiado com sucesso!' : '🔗 Copiar Link para Convidar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Chat em Tempo Real */}
        <div className="chat-column">
          <div className="chat-top-bar">
            <div className="chat-topic-info">
              <span className="topic-icon">💬</span>
              <div>
                <h4>Sala Geral da Turma Web3</h4>
                <p>
                  {totalOnlineCount === 1
                    ? 'Aguardando outros colegas entrarem na sala...'
                    : `${totalOnlineCount} participantes online ao vivo`}
                </p>
              </div>
            </div>
          </div>

          <div className="chat-messages-container">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id

              return (
                <div
                  key={msg.id}
                  className={`chat-message-row ${isMine ? 'mine' : 'theirs'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt=""
                      className="msg-avatar"
                    />
                  )}

                  <div className="msg-content-wrap">
                    <div className="msg-meta-top">
                      <span className="msg-sender">{isMine ? 'Você' : msg.senderName}</span>
                      <time className="msg-time">{formatTime(msg.timestamp)}</time>
                    </div>

                    <div className="msg-bubble">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Digite uma mensagem para todos online..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="btn-send-msg" disabled={!inputText.trim()}>
              Enviar ➔
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
