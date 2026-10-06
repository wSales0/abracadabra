import { FormEvent, useEffect, useRef, useState } from 'react'
import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import {
  getChatMessages,
  initCommunityRealtime,
  sendChatMessage,
  sendCryptoTransferInChat,
} from '../lib/communityChat'

interface CommunityChatPanelProps {
  user: UserProfile
  onSaveUser: (changes: Partial<UserProfile>) => void
  onTriggerMission: (missionId: string, msg?: string) => void
}

export function CommunityChatPanel({ user, onSaveUser, onTriggerMission }: CommunityChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages())
  const [inputText, setInputText] = useState('')
  const [realOnlinePeers, setRealOnlinePeers] = useState<OnlineStudent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting')
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<OnlineStudent | null>(null)
  const [transferAmount, setTransferAmount] = useState('0.05')
  const [transferError, setTransferError] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [receivedCryptoToast, setReceivedCryptoToast] = useState<string>('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const balance = user.practiceBalance ?? 2.5

  useEffect(() => {
    // Inicializa comunicação em tempo real global (MQTT + BroadcastChannel)
    const cleanup = initCommunityRealtime(user, {
      onPresenceUpdate: (peers) => {
        setRealOnlinePeers(peers)
      },
      onMessageReceived: (updatedMessages) => {
        setMessages(updatedMessages)
      },
      onStatusChange: (status) => {
        setConnectionStatus(status)
      },
      onCryptoReceived: (notice, updatedUser) => {
        setReceivedCryptoToast(notice)
        onSaveUser({
          practiceBalance: updatedUser.practiceBalance,
          practiceTransactions: updatedUser.practiceTransactions,
        })
        setTimeout(() => setReceivedCryptoToast(''), 6000)
      },
    })

    return () => cleanup()
  }, [user.id, user.displayName, user.practiceBalance, user.avatarUrl])

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

  function handleOpenTransferModal(recipient?: OnlineStudent) {
    if (recipient) {
      setSelectedRecipient(recipient)
    } else if (realOnlinePeers.length > 0) {
      setSelectedRecipient(realOnlinePeers[0])
    } else {
      setSelectedRecipient(null)
    }
    setTransferError('')
    setShowTransferModal(true)
  }

  function handleSendCrypto() {
    setTransferError('')

    if (!selectedRecipient) {
      setTransferError('Nenhum aluno selecionado. É necessário ter outro aluno conectado para enviar.')
      return
    }

    const numAmount = parseFloat(transferAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferError('Digite um valor válido em SOL para enviar.')
      return
    }

    if (numAmount + 0.000005 > balance) {
      setTransferError(`Saldo insuficiente. Você tem ${balance.toFixed(4)} SOL disponível.`)
      return
    }

    const res = sendCryptoTransferInChat(user, selectedRecipient, numAmount)
    if (res.success && res.updatedUser && res.messages) {
      onSaveUser({
        practiceBalance: res.updatedUser.practiceBalance,
        practiceTransactions: res.updatedUser.practiceTransactions,
      })
      setMessages(res.messages)
      setShowTransferModal(false)
      onTriggerMission(
        'mission_send_simulation',
        `🎉 Parabéns! Você transferiu ${numAmount} SOL para ${selectedRecipient.name} ao vivo!`
      )
    } else {
      setTransferError(res.error || 'Não foi possível realizar o envio.')
    }
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
      {/* Toast flutuante quando recebe cripto ao vivo de outro usuário */}
      {receivedCryptoToast && (
        <div className="crypto-received-banner" role="status">
          <span className="toast-icon">🎁</span>
          <div>
            <strong>Transferência On-Chain Recebida!</strong>
            <p>{receivedCryptoToast}</p>
          </div>
        </div>
      )}

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
            Esta sala conecta os usuários que realmente estão navegando no site agora. Converse em tempo real e transfira
            moedas de teste (SOL) diretamente pelo chat!
          </p>
        </div>
      </div>

      <div className="community-grid">
        {/* Coluna da Esquerda: Usuários Reais Conectados */}
        <div className="classmates-column">
          <div className="column-title-box">
            <div className="column-title-row">
              <h3>Alunos Conectados Agora</h3>
              <span className="real-tag">100% Real</span>
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
                <small className="classmate-role">
                  {user.level || 'Aprendiz'} · {balance.toFixed(2)} SOL
                </small>
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
                <button
                  type="button"
                  className="btn-tip-classmate"
                  onClick={() => handleOpenTransferModal(student)}
                  title={`Enviar SOL de teste para ${student.name}`}
                >
                  💸 Mandar SOL
                </button>
              </div>
            ))}

            {/* Aviso quando não há outros colegas reais online */}
            {realOnlinePeers.length === 0 && (
              <div className="no-peers-box">
                <span className="no-peers-icon">📡</span>
                <h4>Você é o único aluno conectado agora</h4>
                <p>
                  Não há outros visitantes no momento. Para ver o chat e a transferência de moedas funcionando ao vivo com
                  outra pessoa real:
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
            <button
              type="button"
              className="btn-open-transfer"
              onClick={() => handleOpenTransferModal()}
            >
              🎁 Enviar Cripto no Chat
            </button>
          </div>

          <div className="chat-messages-container">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id
              const isTransfer = Boolean(msg.transfer)

              return (
                <div
                  key={msg.id}
                  className={`chat-message-row ${isMine ? 'mine' : 'theirs'} ${isTransfer ? 'is-transfer' : ''}`}
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

                    {isTransfer && msg.transfer ? (
                      <div className="crypto-transfer-card">
                        <div className="transfer-card-header">
                          <span className="tx-symbol-badge">⚡ TRANSFERÊNCIA ON-CHAIN</span>
                          <span className="tx-status-confirmed">🟢 Confirmada</span>
                        </div>
                        <div className="transfer-card-amount">
                          <strong>+{msg.transfer.amount.toFixed(4)} SOL</strong>
                          <span>para {msg.transfer.recipientName}</span>
                        </div>
                        <div className="transfer-card-sig">
                          <small>Hash da transação:</small>
                          <code>
                            {msg.transfer.signature.slice(0, 10)}...{msg.transfer.signature.slice(-8)}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <div className="msg-bubble">
                        <p>{msg.text}</p>
                      </div>
                    )}
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

      {/* Modal de Envio Rápido de Cripto no Chat */}
      {showTransferModal && (
        <div className="modal-backdrop" onClick={() => setShowTransferModal(false)}>
          <div className="chat-transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💸 Enviar Moedas de Teste no Chat</h3>
              <button type="button" className="btn-close-modal" onClick={() => setShowTransferModal(false)}>
                ✕
              </button>
            </div>

            <p className="modal-desc">
              Envie frações de SOL simulado para outro aluno conectado. A transação aparecerá no chat e o saldo do colega
              aumentará em tempo real!
            </p>

            {realOnlinePeers.length === 0 ? (
              <div className="modal-no-recipients">
                <p>⚠️ Não há outros alunos conectados no momento para receber.</p>
                <small>Abra o site em uma segunda aba ou janela anônima para testar a transferência entre duas pessoas!</small>
              </div>
            ) : (
              <label className="modal-field-label">
                <span>Escolha o Colega Conectado:</span>
                <select
                  value={selectedRecipient?.id || ''}
                  onChange={(e) => {
                    const found = realOnlinePeers.find((s) => s.id === e.target.value)
                    if (found) setSelectedRecipient(found)
                  }}
                >
                  {realOnlinePeers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="modal-field-label">
              <span>Valor do Envio (SOL):</span>
              <div className="amount-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={transferAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.')
                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                      setTransferAmount(val)
                    }
                  }}
                  placeholder="0.05"
                />
                <span className="amount-suffix">SOL</span>
              </div>
            </label>

            <div className="quick-transfer-chips">
              <button type="button" onClick={() => setTransferAmount('0.05')}>
                0.05 SOL
              </button>
              <button type="button" onClick={() => setTransferAmount('0.10')}>
                0.10 SOL
              </button>
              <button type="button" onClick={() => setTransferAmount('0.25')}>
                0.25 SOL
              </button>
            </div>

            <div className="tx-breakdown mini">
              <div className="breakdown-row">
                <span>Seu Saldo Atual:</span>
                <strong>{balance.toFixed(4)} SOL</strong>
              </div>
              <div className="breakdown-row">
                <span>Taxa de Rede (Gas Fee):</span>
                <span className="fee-value">0.000005 SOL</span>
              </div>
            </div>

            {transferError && <p className="modal-error-notice">{transferError}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowTransferModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirm-transfer"
                disabled={!selectedRecipient || realOnlinePeers.length === 0}
                onClick={handleSendCrypto}
              >
                Confirmar e Enviar no Chat 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
