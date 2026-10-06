import { useState } from 'react'
import {
  SUPPORTED_WALLETS,
  SupportedWallet,
  connectWallet,
  isValidSolanaAddress,
  signInWithWallet,
} from '../lib/walletAuth'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConnected: () => void
}

type ModalTab = 'extensions' | 'manual'

export function WalletModal({ isOpen, onClose, onConnected }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('extensions')
  const [connectingId, setConnectingId] = useState<SupportedWallet | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualProvider, setManualProvider] = useState('Phantom')

  if (!isOpen) return null

  async function handleSelectWallet(walletId: SupportedWallet) {
    try {
      setErrorMessage('')
      setConnectingId(walletId)
      const result = await connectWallet(walletId)
      signInWithWallet(result.address, result.providerName)
      onConnected()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Não foi possível conectar com a carteira.')
      }
    } finally {
      setConnectingId(null)
    }
  }

  function handleManualConnect() {
    const trimmed = manualAddress.trim()
    if (!trimmed) {
      setErrorMessage('Por favor, digite ou cole seu endereço público Solana.')
      return
    }
    if (!isValidSolanaAddress(trimmed)) {
      setErrorMessage('Endereço inválido. O endereço Solana deve ter entre 32 e 44 caracteres Base58.')
      return
    }

    signInWithWallet(trimmed, manualProvider)
    onConnected()
  }

  function handleCancel() {
    setConnectingId(null)
    setErrorMessage('')
  }

  return (
    <div className="wallet-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <div>
            <h3 className="wallet-modal-title">Conectar Carteira</h3>
            <p className="wallet-modal-subtitle">Acesse a área do aluno com sua conta Solana</p>
          </div>
          <button className="wallet-modal-close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <div className="wallet-modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('extensions')
              setErrorMessage('')
            }}
          >
            Extensão do Navegador
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manual')
              setErrorMessage('')
            }}
          >
            Colar Endereço
          </button>
        </div>

        {activeTab === 'extensions' ? (
          <div className="wallet-list">
            {SUPPORTED_WALLETS.map((w) => {
              const installed = w.isInstalled()
              const isConnecting = connectingId === w.id

              return (
                <button
                  key={w.id}
                  type="button"
                  className={`wallet-option ${isConnecting ? 'connecting' : ''}`}
                  onClick={() => handleSelectWallet(w.id)}
                >
                  <div className="wallet-icon">{w.icon}</div>
                  <div className="wallet-info">
                    <strong>{w.name}</strong>
                    <small>{w.description}</small>
                  </div>
                  {w.id === 'simulated' ? (
                    <span className="wallet-tag demo">Devnet Demo</span>
                  ) : installed ? (
                    <span className="wallet-tag">Detectada</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="manual-connect-card">
            <label htmlFor="manual-wallet-provider" className="input-label">
              Sua Carteira / Provedor
            </label>
            <div className="select-wrap">
              <select
                id="manual-wallet-provider"
                value={manualProvider}
                onChange={(e) => setManualProvider(e.target.value)}
              >
                <option value="Phantom">Phantom</option>
                <option value="Solflare">Solflare</option>
                <option value="Backpack">Backpack</option>
                <option value="Coinbase Wallet">Coinbase Wallet</option>
                <option value="Solana Wallet">Outra Carteira Solana</option>
              </select>
            </div>

            <label htmlFor="manual-wallet-addr" className="input-label" style={{ marginTop: '14px' }}>
              Chave Pública (Endereço Solana)
            </label>
            <div className="input-wrap">
              <input
                id="manual-wallet-addr"
                type="text"
                placeholder="Ex: 7Xk4B...8jKp2"
                value={manualAddress}
                onChange={(e) => {
                  setManualAddress(e.target.value)
                  setErrorMessage('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleManualConnect()}
              />
            </div>
            <p style={{ margin: '8px 0 16px', fontSize: '10px', color: '#8c869c' }}>
              💡 Dica: Abra sua carteira Phantom, copie seu endereço e cole aqui para entrar imediatamente.
            </p>

            <button type="button" className="primary-button" onClick={handleManualConnect}>
              <span>Entrar com esta carteira</span>
              <span>→</span>
            </button>
          </div>
        )}

        {connectingId && (
          <div className="wallet-connecting-status">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="connecting-pulse">●</span>
                <strong>Aguardando aprovação da extensão...</strong>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#bbaad8' }}>
                Verifique se o ícone da Phantom/extensão na barra do navegador está com notificação.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button
                type="button"
                className="wallet-quick-btn"
                onClick={() => handleSelectWallet('simulated')}
                title="Entrar direto com a carteira de teste"
              >
                ⚡ Usar Demo
              </button>
              <button type="button" className="wallet-cancel-btn" onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="wallet-error-status">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <strong>Aviso:</strong> {errorMessage}
              </div>
              <button
                type="button"
                className="wallet-quick-btn"
                onClick={() => {
                  setActiveTab('manual')
                  setErrorMessage('')
                }}
                style={{ whiteSpace: 'nowrap', marginTop: '2px' }}
              >
                Colar Endereço
              </button>
            </div>
          </div>
        )}

        <div className="wallet-security-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>Conexão segura · Nunca solicitaremos sua chave privada</span>
        </div>
      </div>
    </div>
  )
}
