import { FormEvent, useEffect, useRef, useState } from 'react'
import type { ChatMessage, OnlineStudent, UserProfile } from '../types'
import {
  CLASSMATE_STUDENTS,
  getChatMessages,
  sendChatMessage,
  sendCryptoTransferInChat,
  subscribeToChat,
} from '../lib/communityChat'

interface CommunityChatPanelProps {
  user: UserProfile
  onSaveUser: (changes: Partial<UserProfile>) => void
  onTriggerMission: (missionId: string, msg?: string) => void
}

export function CommunityChatPanel({ user, onSaveUser, onTriggerMission }: CommunityChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages())
  const [inputText, setInputText] = useState('')
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<OnlineStudent>(CLASSMATE_STUDENTS[0])
  const [transferAmount, setTransferAmount] = useState('0.05')
  const [transferError, setTransferError] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const balance = user.practiceBalance ?? 2.5

  useEffect(() => {
    // Sincronização em tempo real entre abas do navegador via BroadcastChannel
    const unsubscribe = subscribeToChat((updated) => {
      setMessages(updated)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!inputText.trim()) return
    const updated = sendChatMessage(user, inputText)
    setMessages(updated)
    setInputText('')
  }

  function handleSendCrypto() {
    setTransferError('')
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
        `🎉 Parabéns! Você transferiu ${numAmount} SOL para ${selectedRecipient.name} no chat da comunidade!`
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

  function formatTime(isoString: string) {
    try {
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString))
    } catch {
      return 'Agora'
    }
  }

  return (
    <section className="community-chat-panel">
      <div className="community-header">
        <div>
          <div className="community-badge-row">
            <span className="live-pulse-dot" />
            <span className="community-online-count">{CLASSMATE_STUDENTS.length + 1} Alunos Online Agora</span>
            <span className="community-safe-tag">🛡️ Ambiente Seguro de Prática</span>
          </div>
          <h1>Comunidade &amp; Chat da Turma</h1>
          <p className="panel-lead">
            Converse com outros alunos, tire dúvidas e pratique transferir moedas de teste (SOL) diretamente no bate-papo!
          </p>
        </div>
      </div>

      <div className="community-grid">
        {/* Coluna da Esquerda: Colegas Conectados */}
        <div className="classmates-column">
          <div className="column-title-box">
            <h3>Alunos Conectados</h3>
            <small>Clique para enviar SOL de teste</small>
          </div>

          <div className="classmates-list">
            {/* O próprio aluno */}
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
                </div>
                <small className="classmate-role">Aluno Ativo · {balance.toFixed(2)} SOL</small>
              </div>
            </div>

            {/* Outros colegas de turma */}
            {CLASSMATE_STUDENTS.map((student) => (
              <div key={student.id} className="classmate-card">
                <div className="classmate-avatar-wrap">
                  <img src={student.avatarUrl} alt="" className="classmate-avatar" />
                  <span className={`status-dot ${student.status}`} />
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
                  onClick={() => {
                    setSelectedRecipient(student)
                    setShowTransferModal(true)
                  }}
                  title={`Enviar SOL de teste para ${student.name}`}
                >
                  💸 Mandar SOL
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna da Direita: Chat em Tempo Real */}
        <div className="chat-column">
          <div className="chat-top-bar">
            <div className="chat-topic-info">
              <span className="topic-icon">💬</span>
              <div>
                <h4>Sala Geral da Turma Web3</h4>
                <p>Tire dúvidas, mande mensagens e pratique transferir micro-quantias</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-open-transfer"
              onClick={() => setShowTransferModal(true)}
            >
              🎁 Enviar Cripto no Chat
            </button>
          </div>

          <div className="chat-messages-container">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id
              const isTransfer = Boolean(msg.transfer)

              return (
                <div key={msg.id} className={`chat-message-row ${isMine ? 'mine' : 'theirs'} ${isTransfer ? 'is-transfer' : ''}`}>
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
              placeholder="Digite uma mensagem para a turma..."
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
              Envie frações de SOL simulado para um colega. A transferência aparecerá no chat com a hash de validação!
            </p>

            <label className="modal-field-label">
              <span>Escolha o Colega:</span>
              <select
                value={selectedRecipient.id}
                onChange={(e) => {
                  const found = CLASSMATE_STUDENTS.find((s) => s.id === e.target.value)
                  if (found) setSelectedRecipient(found)
                }}
              >
                {CLASSMATE_STUDENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </label>

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
                <span>Saldo Atual:</span>
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
              <button type="button" className="btn-confirm-transfer" onClick={handleSendCrypto}>
                Confirmar e Enviar no Chat 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
