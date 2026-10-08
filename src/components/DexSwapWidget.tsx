import { useState, useId } from 'react'
import type { PracticeTransaction, UserProfile } from '../types'
import { swapPracticeTokens, SWAP_RATES } from '../lib/practiceWallet'

interface DexSwapWidgetProps {
  user: UserProfile
  onSave: (changes: Partial<UserProfile>) => void
  onTriggerMission: (missionId: string, msg?: string) => void
  onOpenExplorer: (tx: PracticeTransaction) => void
}

type TokenSymbol = 'SOL' | 'USDC' | 'ABRA' | 'BTC'

const TOKEN_INFO: Record<TokenSymbol, { name: string; icon: string; description: string }> = {
  SOL: { name: 'Solana Devnet', icon: '◎', description: 'Moeda nativa da rede para pagar taxas e transações' },
  USDC: { name: 'USD Coin (Simulado)', icon: '💵', description: 'Stablecoin com valor pareado ao Dólar americano' },
  ABRA: { name: 'Token Abracadabra', icon: '🪄', description: 'Token de governança da comunidade educacional' },
  BTC: { name: 'Wrapped BTC (Simulado)', icon: '₿', description: 'Versão espelho do Bitcoin na rede Solana' },
}

export function DexSwapWidget({ user, onSave, onTriggerMission, onOpenExplorer }: DexSwapWidgetProps) {
  const [fromSymbol, setFromSymbol] = useState<TokenSymbol>('SOL')
  const [toSymbol, setToSymbol] = useState<TokenSymbol>('USDC')
  const [fromAmount, setFromAmount] = useState<string>('0.5')
  const [loading, setLoading] = useState(false)
  const [swapFeedback, setSwapFeedback] = useState<{ success: boolean; msg: string; tx?: PracticeTransaction } | null>(null)

  const currentSol = user.practiceBalance ?? 2.5
  const tokens = { USDC: 150, ABRA: 500, BTC: 0.0015, ...(user.tokens || {}) }

  function getTokenBalance(symbol: TokenSymbol): number {
    if (symbol === 'SOL') return currentSol
    return tokens[symbol] || 0
  }

  const parsedFrom = parseFloat(fromAmount.replace(',', '.')) || 0

  // Calcula estimativa recebida
  let estimatedReceived = 0
  if (parsedFrom > 0) {
    if (fromSymbol === 'SOL') {
      estimatedReceived = parsedFrom * (SWAP_RATES[toSymbol] || 1)
    } else if (toSymbol === 'SOL') {
      estimatedReceived = parsedFrom / (SWAP_RATES[fromSymbol] || 1)
    } else {
      const solEquiv = parsedFrom / (SWAP_RATES[fromSymbol] || 1)
      estimatedReceived = solEquiv * (SWAP_RATES[toSymbol] || 1)
    }
  }

  function handleSwapSymbols() {
    setFromSymbol(toSymbol)
    setToSymbol(fromSymbol)
    setSwapFeedback(null)
  }

  function handleExecuteSwap() {
    if (loading) return
    setSwapFeedback(null)

    if (parsedFrom <= 0) {
      setSwapFeedback({ success: false, msg: 'Informe uma quantidade válida para trocar.' })
      return
    }

    const available = getTokenBalance(fromSymbol)
    if (parsedFrom > available) {
      setSwapFeedback({ success: false, msg: `Saldo insuficiente de ${fromSymbol}. Você tem ${available.toFixed(4)} ${fromSymbol}.` })
      return
    }

    setLoading(true)
    setTimeout(() => {
      const res = swapPracticeTokens(user, fromSymbol, toSymbol, parsedFrom)
      setLoading(false)

      if (res.success && res.updatedUser && res.transaction) {
        onSave({
          practiceBalance: res.updatedUser.practiceBalance,
          tokens: res.updatedUser.tokens,
          xp: res.updatedUser.xp,
          badges: res.updatedUser.badges,
          practiceTransactions: res.updatedUser.practiceTransactions,
        })

        setSwapFeedback({
          success: true,
          msg: `🎉 Troca realizada! Você recebeu +${res.receivedAmount} ${toSymbol} na sua carteira!`,
          tx: res.transaction,
        })

        onTriggerMission(
          'mission_swap_token',
          '🎉 Missão Concluída: Você fez seu primeiro Swap em uma corretora descentralizada (DEX)!'
        )
      } else {
        setSwapFeedback({
          success: false,
          msg: res.error || 'Erro ao processar o Swap na simulação.',
        })
      }
    }, 700)
  }

  return (
    <div className="dex-swap-container">
      {/* Grade de Saldo Multimoedas da Carteira */}
      <div className="token-balances-card">
        <div className="token-balances-header">
          <span className="balance-tag">💰 SEUS SALDOS MULTIMOEDAS</span>
          <small>Todos os saldos são didáticos e seguros</small>
        </div>
        <div className="token-balances-grid">
          <div className="token-balance-item">
            <span className="t-icon">◎</span>
            <div className="t-meta">
              <strong>{currentSol.toFixed(4)} SOL</strong>
              <small>Solana Devnet</small>
            </div>
          </div>
          <div className="token-balance-item">
            <span className="t-icon">💵</span>
            <div className="t-meta">
              <strong>{tokens.USDC.toFixed(2)} USDC</strong>
              <small>Dólar Digital</small>
            </div>
          </div>
          <div className="token-balance-item">
            <span className="t-icon">🪄</span>
            <div className="t-meta">
              <strong>{tokens.ABRA.toFixed(1)} ABRA</strong>
              <small>Governança</small>
            </div>
          </div>
          <div className="token-balance-item">
            <span className="t-icon">₿</span>
            <div className="t-meta">
              <strong>{tokens.BTC.toFixed(6)} BTC</strong>
              <small>Wrapped BTC</small>
            </div>
          </div>
        </div>
      </div>

      {/* Caixa Interativa de Swap */}
      <div className="dex-swap-card">
        <div className="dex-swap-header">
          <div>
            <h3>🔄 Simulador de Corretora Descentralizada (DEX)</h3>
            <p>Troque tokens instantaneamente por contratos inteligentes, sem pedir autorização a nenhum banco.</p>
          </div>
          <span className="dex-amm-badge">Automated Market Maker (AMM)</span>
        </div>

        <div className="swap-form-body">
          {/* Campo De (Origem) */}
          <div className="swap-field-box">
            <div className="field-top-row">
              <label>Você paga:</label>
              <span className="available-label">
                Disponível: <strong>{getTokenBalance(fromSymbol).toFixed(4)} {fromSymbol}</strong>
              </span>
            </div>
            <div className="field-input-row">
              <input
                type="text"
                inputMode="decimal"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
              />
              <select
                value={fromSymbol}
                onChange={(e) => {
                  const val = e.target.value as TokenSymbol
                  if (val === toSymbol) setToSymbol(fromSymbol)
                  setFromSymbol(val)
                }}
              >
                <option value="SOL">◎ SOL</option>
                <option value="USDC">💵 USDC</option>
                <option value="ABRA">🪄 ABRA</option>
                <option value="BTC">₿ BTC</option>
              </select>
            </div>
            <small className="field-desc">{TOKEN_INFO[fromSymbol].description}</small>
          </div>

          {/* Botão de Inversão */}
          <div className="swap-switch-row">
            <button
              type="button"
              className="btn-switch-tokens"
              onClick={handleSwapSymbols}
              title="Inverter moedas de envio e recebimento"
            >
              ⇅
            </button>
          </div>

          {/* Campo Para (Destino) */}
          <div className="swap-field-box">
            <div className="field-top-row">
              <label>Você recebe (estimado):</label>
              <span className="available-label">
                Saldo atual: <strong>{getTokenBalance(toSymbol).toFixed(4)} {toSymbol}</strong>
              </span>
            </div>
            <div className="field-input-row">
              <input
                type="text"
                readOnly
                value={estimatedReceived > 0 ? (toSymbol === 'BTC' ? estimatedReceived.toFixed(6) : estimatedReceived.toFixed(2)) : '0.0'}
                className="input-readonly"
              />
              <select
                value={toSymbol}
                onChange={(e) => {
                  const val = e.target.value as TokenSymbol
                  if (val === fromSymbol) setFromSymbol(toSymbol)
                  setToSymbol(val)
                }}
              >
                <option value="USDC">💵 USDC</option>
                <option value="SOL">◎ SOL</option>
                <option value="ABRA">🪄 ABRA</option>
                <option value="BTC">₿ BTC</option>
              </select>
            </div>
            <small className="field-desc">{TOKEN_INFO[toSymbol].description}</small>
          </div>

          {/* Dados Pedagógicos da Ordem */}
          <div className="swap-specs-card">
            <div className="spec-item">
              <span>Taxa de Rede (Gas):</span>
              <strong>0.000005 SOL (~R$ 0,004)</strong>
            </div>
            <div className="spec-item">
              <span>Tolerância de Slippage:</span>
              <strong title="Margem de variação máxima aceita enquanto a transação é gravada">0.5% (Padrão de Segurança)</strong>
            </div>
            <div className="spec-item">
              <span>Roteamento da Operação:</span>
              <strong>Pool Direto AMM Abracadabra</strong>
            </div>
          </div>

          {swapFeedback && (
            <div className={`swap-feedback-banner ${swapFeedback.success ? 'success' : 'error'}`}>
              <p>{swapFeedback.msg}</p>
              {swapFeedback.tx && (
                <button
                  type="button"
                  className="btn-view-swap-explorer"
                  onClick={() => onOpenExplorer(swapFeedback.tx!)}
                >
                  Ver Comprovante no Explorador 🔍
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn-execute-swap"
            disabled={loading || parsedFrom <= 0}
            onClick={handleExecuteSwap}
          >
            {loading ? 'Processando Troca no Smart Contract...' : `Executar Troca (${fromSymbol} ➔ ${toSymbol}) 🔄`}
          </button>
        </div>

        <div className="swap-edu-tips">
          <h4>💡 O que é uma DEX e por que ela revolucionou o mercado?</h4>
          <ul>
            <li>🏦 <strong>Sem Banco / Sem Corretora Central:</strong> Em uma DEX (Decentralized Exchange), as trocas acontecem direto na blockchain através de <em>Smart Contracts</em> e <em>Pools de Liquidez</em>.</li>
            <li>⚡ <strong>Autocustódia:</strong> As moedas nunca saem do seu controle até o momento exato em que a troca é realizada atomicamente.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
