import { useState } from 'react'
import { signInWithSocial } from '../lib/socialAuth'
import {
  getGoogleClientId,
  isGoogleConfigured,
  requestOfficialGoogleLogin,
  saveLocalGoogleClientId,
} from '../lib/googleAuth'

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const [tab, setTab] = useState<'quick' | 'oauth'>('quick')
  const [email, setEmail] = useState('')
  const [clientIdInput, setClientIdInput] = useState(() => getGoogleClientId())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  function handleQuickLogin(customEmail?: string) {
    setIsSubmitting(true)
    setTimeout(() => {
      const emailToUse = customEmail || email.trim() || 'aluno.web3@gmail.com'
      signInWithSocial('google', emailToUse)
      setIsSubmitting(false)
      onSuccess()
    }, 300)
  }

  function handleTriggerOfficialOAuth() {
    setErrorMessage('')
    setIsSubmitting(true)
    const success = requestOfficialGoogleLogin({
      onSuccess: () => {
        setIsSubmitting(false)
        onSuccess()
      },
      onError: (err) => {
        setIsSubmitting(false)
        setErrorMessage(err)
      },
    })

    if (!success) {
      setIsSubmitting(false)
      setTab('oauth')
      setErrorMessage('Informe o Google Client ID para abrir a janela oficial do Google.')
    }
  }

  function handleSaveClientId() {
    if (!clientIdInput.trim()) {
      setErrorMessage('Digite ou cole um Google Client ID válido.')
      return
    }
    saveLocalGoogleClientId(clientIdInput.trim())
    setSavedSuccess(true)
    setErrorMessage('')
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="wallet-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wallet-modal google-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="google-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="wallet-modal-title">Entrar com Google</h3>
              <p className="wallet-modal-subtitle">Acesso direto com sua conta Google</p>
            </div>
          </div>
          <button className="wallet-modal-close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <div className="wallet-modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'quick' ? 'active' : ''}`}
            onClick={() => {
              setTab('quick')
              setErrorMessage('')
            }}
          >
            Acesso Rápido
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'oauth' ? 'active' : ''}`}
            onClick={() => {
              setTab('oauth')
              setErrorMessage('')
            }}
          >
            Janela Oficial Google
          </button>
        </div>

        {tab === 'quick' ? (
          <>
            <div className="google-account-list">
              <button
                type="button"
                className="google-quick-account"
                onClick={() => handleQuickLogin('zablantkd@gmail.com')}
                disabled={isSubmitting}
              >
                <div className="google-avatar-letter">Z</div>
                <div className="google-acc-info">
                  <strong>Zablan (Aluno)</strong>
                  <small>zablantkd@gmail.com</small>
                </div>
                <span className="google-select-arrow">→</span>
              </button>

              <button
                type="button"
                className="google-quick-account"
                onClick={() => handleQuickLogin('caio.aluno@gmail.com')}
                disabled={isSubmitting}
              >
                <div className="google-avatar-letter purple">C</div>
                <div className="google-acc-info">
                  <strong>Caio (Aluno)</strong>
                  <small>caio.aluno@gmail.com</small>
                </div>
                <span className="google-select-arrow">→</span>
              </button>

              <button
                type="button"
                className="google-quick-account"
                onClick={() => handleQuickLogin('aluno.web3@gmail.com')}
                disabled={isSubmitting}
              >
                <div className="google-avatar-letter purple">A</div>
                <div className="google-acc-info">
                  <strong>Aluno Web3</strong>
                  <small>aluno.web3@gmail.com</small>
                </div>
                <span className="google-select-arrow">→</span>
              </button>
            </div>

            <div className="divider" style={{ margin: '14px 0' }}>
              <span>OU DIGITE SEU GMAIL</span>
            </div>

            <div className="input-wrap" style={{ marginBottom: '12px' }}>
              <input
                type="email"
                placeholder="seu.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickLogin()}
              />
              <button
                type="button"
                onClick={() => handleQuickLogin()}
                aria-label="Continuar com este e-mail"
                disabled={isSubmitting}
              >
                →
              </button>
            </div>

            <button
              type="button"
              className="wallet-button"
              style={{ marginTop: '10px', borderColor: 'rgba(66, 133, 244, 0.4)' }}
              onClick={handleTriggerOfficialOAuth}
            >
              <span>🌐 Abrir Janela Nativa accounts.google.com</span>
            </button>
          </>
        ) : (
          <div className="manual-connect-card">
            <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#cac4d8', lineHeight: 1.5 }}>
              Para que a janela oficial do Google (<strong>accounts.google.com</strong>) abra no seu navegador exibindo as contas logadas no seu Chrome, informe o <strong>Google OAuth Client ID</strong>:
            </p>

            <label htmlFor="google-client-id-input" className="input-label">
              Google Client ID
            </label>
            <div className="input-wrap">
              <input
                id="google-client-id-input"
                type="text"
                placeholder="ex: 123456...apps.googleusercontent.com"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
              />
              <button type="button" onClick={handleSaveClientId} title="Salvar Client ID">
                💾
              </button>
            </div>

            {savedSuccess && (
              <p style={{ color: '#14f195', fontSize: '10px', marginTop: '6px' }}>
                ✓ Client ID salvo com sucesso!
              </p>
            )}

            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  handleSaveClientId()
                  handleTriggerOfficialOAuth()
                }}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                <span>Salvar & Abrir Janela do Google</span>
                <span>→</span>
              </button>
            </div>

            <div style={{ marginTop: '16px', padding: '10px 12px', background: 'rgba(10, 9, 18, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ font: "600 10px 'DM Mono', monospace", color: '#a87eff', display: 'block', marginBottom: '6px' }}>
                COMO PEGAR EM 2 MINUTOS NO GOOGLE CLOUD:
              </span>
              <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '10px', color: '#9d96ab', lineHeight: 1.6 }}>
                <li>Acesse <strong>console.cloud.google.com/apis/credentials</strong></li>
                <li>Crie uma credencial <strong>ID do cliente OAuth (Aplicativo da Web)</strong></li>
                <li>Em <strong>Origens JavaScript autorizadas</strong> adicione <code>http://localhost:5173</code></li>
                <li>Cole o ID gerado acima ou no arquivo <code>.env</code> como <code>VITE_GOOGLE_CLIENT_ID</code></li>
              </ol>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="wallet-error-status" style={{ marginTop: '12px' }}>
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        <div className="embedded-wallet-callout">
          <span>✨</span>
          <div>
            <strong>Carteira Solana Embutida Automática</strong>
            <p>Ao entrar com sua conta Google, vinculamos uma carteira Solana Devnet diretamente ao seu perfil.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
