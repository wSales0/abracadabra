import { useState } from 'react'
import type { PracticeTransaction, UserProfile } from '../types'
import { stakePracticeSol, unstakePracticeSol, claimStakingRewards } from '../lib/practiceWallet'

interface StakingWidgetProps {
  user: UserProfile
  onSave: (changes: Partial<UserProfile>) => void
  onTriggerMission: (missionId: string, msg?: string) => void
  onOpenExplorer: (tx: PracticeTransaction) => void
}

export function StakingWidget({ user, onSave, onTriggerMission, onOpenExplorer }: StakingWidgetProps) {
  const [stakeAmount, setStakeAmount] = useState('0.5')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string; tx?: PracticeTransaction } | null>(null)

  const currentSol = user.practiceBalance ?? 2.5
  const stakedBalance = user.stakedBalance || 0
  const parsedStake = parseFloat(stakeAmount.replace(',', '.')) || 0
  const parsedUnstake = parseFloat(unstakeAmount.replace(',', '.')) || 0

  function handleStake() {
    if (loading) return
    setFeedback(null)

    if (parsedStake <= 0) {
      setFeedback({ success: false, msg: 'Informe uma quantia válida em SOL para depositar.' })
      return
    }

    setLoading(true)
    setTimeout(() => {
      const res = stakePracticeSol(user, parsedStake)
      setLoading(false)

      if (res.success && res.updatedUser && res.transaction) {
        onSave({
          practiceBalance: res.updatedUser.practiceBalance,
          stakedBalance: res.updatedUser.stakedBalance,
          stakedAt: res.updatedUser.stakedAt,
          xp: res.updatedUser.xp,
          badges: res.updatedUser.badges,
          practiceTransactions: res.updatedUser.practiceTransactions,
        })

        setFeedback({
          success: true,
          msg: `🎉 Sucesso! Você colocou ${parsedStake} SOL em Staking com o Validador Didático!`,
          tx: res.transaction,
        })

        onTriggerMission(
          'mission_stake_sol',
          '🎉 Missão Concluída: Você fez Staking e aprendeu como a rede Solana se mantém segura!'
        )
      } else {
        setFeedback({
          success: false,
          msg: res.error || 'Erro ao processar o depósito em Staking.',
        })
      }
    }, 700)
  }

  function handleUnstake() {
    if (loading) return
    setFeedback(null)

    if (parsedUnstake <= 0) {
      setFeedback({ success: false, msg: 'Informe uma quantia válida em SOL para retirar.' })
      return
    }

    setLoading(true)
    setTimeout(() => {
      const res = unstakePracticeSol(user, parsedUnstake)
      setLoading(false)

      if (res.success && res.updatedUser && res.transaction) {
        onSave({
          practiceBalance: res.updatedUser.practiceBalance,
          stakedBalance: res.updatedUser.stakedBalance,
          practiceTransactions: res.updatedUser.practiceTransactions,
        })

        setFeedback({
          success: true,
          msg: `🎉 Resgate concluído! +${parsedUnstake} SOL retornou para o saldo disponível da sua carteira.`,
          tx: res.transaction,
        })
        setUnstakeAmount('')
      } else {
        setFeedback({
          success: false,
          msg: res.error || 'Erro ao resgatar o saldo em Staking.',
        })
      }
    }, 700)
  }

  function handleClaimRewards() {
    if (loading) return
    setFeedback(null)

    if (stakedBalance <= 0) {
      setFeedback({ success: false, msg: 'Você precisa ter SOL em Staking para gerar recompensas.' })
      return
    }

    setLoading(true)
    setTimeout(() => {
      const res = claimStakingRewards(user, 0.035)
      setLoading(false)

      if (res.success && res.updatedUser && res.transaction) {
        onSave({
          practiceBalance: res.updatedUser.practiceBalance,
          xp: res.updatedUser.xp,
          practiceTransactions: res.updatedUser.practiceTransactions,
        })

        setFeedback({
          success: true,
          msg: '🎉 Parabéns! Você colheu +0.035 SOL e +15 XP em recompensas de bloco da rede!',
          tx: res.transaction,
        })
      } else {
        setFeedback({
          success: false,
          msg: res.error || 'Erro ao colher recompensas.',
        })
      }
    }, 600)
  }

  return (
    <div className="staking-container">
      {/* Cards de Métricas de Staking */}
      <div className="staking-stats-grid">
        <div className="staking-stat-card primary">
          <span className="stat-label">SOL EM STAKING ATIVO</span>
          <strong>{stakedBalance.toFixed(4)} SOL</strong>
          <small>Rendendo com validadores da rede</small>
        </div>

        <div className="staking-stat-card">
          <span className="stat-label">TAXA ANUAL ESTIMADA (APY)</span>
          <strong className="stat-highlight">~7.2% ao ano</strong>
          <small>Rendimento distribuído por época (Epoch)</small>
        </div>

        <div className="staking-stat-card">
          <span className="stat-label">VALIDADOR SELECIONADO</span>
          <strong>Validador Abracadabra</strong>
          <small>Nó Comunitário Solana Devnet · 100% Uptime</small>
        </div>
      </div>

      {/* Painel Principal de Operações */}
      <div className="staking-main-card">
        <div className="staking-header">
          <div>
            <h3>🌱 Cofre de Staking Educacional (Proof-of-Stake)</h3>
            <p>
              Em blockchains modernas como a Solana, você não precisa de computadores gastando energia excessiva para minerar. Os usuários participam do consenso fazendo Staking.
            </p>
          </div>
          <span className="staking-badge">Proof-of-Stake (PoS)</span>
        </div>

        {feedback && (
          <div className={`staking-feedback-banner ${feedback.success ? 'success' : 'error'}`}>
            <p>{feedback.msg}</p>
            {feedback.tx && (
              <button
                type="button"
                className="btn-view-stake-explorer"
                onClick={() => onOpenExplorer(feedback.tx!)}
              >
                Ver Comprovante no Explorador 🔍
              </button>
            )}
          </div>
        )}

        <div className="staking-actions-grid">
          {/* Card de Fazer Staking */}
          <div className="staking-box">
            <h4>Depositar em Staking</h4>
            <p>Delegue SOL para o validador e comece a gerar rendimento automático.</p>
            <div className="staking-input-group">
              <label>Quantidade a travar (SOL):</label>
              <div className="input-with-max">
                <input
                  type="text"
                  inputMode="decimal"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                />
                <button
                  type="button"
                  className="btn-max"
                  onClick={() => setStakeAmount(Math.max(0, currentSol - 0.000005).toFixed(4))}
                >
                  Máx
                </button>
              </div>
              <small>Disponível na carteira: {currentSol.toFixed(4)} SOL</small>
            </div>
            <button
              type="button"
              className="btn-submit-stake"
              disabled={loading || parsedStake <= 0}
              onClick={handleStake}
            >
              {loading ? 'Confirmando na Rede...' : 'Depositar em Staking 🌱'}
            </button>
          </div>

          {/* Card de Resgate e Recompensas */}
          <div className="staking-box">
            <h4>Recompensas &amp; Resgate</h4>
            <p>Colha os rendimentos gerados ou retire o seu saldo a qualquer momento.</p>

            <div className="rewards-claim-banner">
              <div>
                <span>Recompensa Simulada Disponível:</span>
                <strong>+0.035 SOL</strong>
              </div>
              <button
                type="button"
                className="btn-claim-rewards"
                disabled={loading || stakedBalance <= 0}
                onClick={handleClaimRewards}
              >
                Colher Recompensas 🎁
              </button>
            </div>

            <div className="staking-input-group">
              <label>Retirar do Staking (SOL):</label>
              <div className="input-with-max">
                <input
                  type="text"
                  inputMode="decimal"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="0.0"
                />
                <button
                  type="button"
                  className="btn-max"
                  onClick={() => setUnstakeAmount(stakedBalance.toFixed(4))}
                >
                  Tudo
                </button>
              </div>
              <small>Total em staking: {stakedBalance.toFixed(4)} SOL</small>
            </div>

            <button
              type="button"
              className="btn-submit-unstake"
              disabled={loading || parsedUnstake <= 0}
              onClick={handleUnstake}
            >
              {loading ? 'Processando Resgate...' : 'Retirar do Staking ↺'}
            </button>
          </div>
        </div>

        <div className="staking-explanation-footer">
          <h4>💡 Como funciona o Staking na vida real?</h4>
          <ul>
            <li>🔒 <strong>Seus fundos continuam seus:</strong> Ao delegar SOL em staking, você não dá a posse do seu dinheiro ao validador, apenas o direito de representação matemática no consenso.</li>
            <li>🌍 <strong>Sustentabilidade:</strong> O Proof-of-Stake da Solana consome menos energia elétrica por transação do que duas buscas no Google!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
