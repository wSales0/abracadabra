import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { getMarketCoins, getRelatedHeadlines } from '../lib/cryptoApi'
import { signOutDemo, updateCurrentUser } from '../lib/demoAuth'
import { createQuestion, getActivityProgress, getLevelFromXp, recordAnswer } from '../lib/activityEngine'
import {
  claimPracticeFaucet,
  resetPracticeWallet,
  rewardPracticeActivity,
  SAMPLE_RECIPIENTS,
  sendPracticeSol,
} from '../lib/practiceWallet'
import { isSpeechSupported, speakText, stopSpeaking } from '../lib/audioVoice'
import { completeMission, getCompletedMissions } from '../lib/missionsEngine'
import { StudentMissionsWidget } from '../components/StudentMissionsWidget'
import { AntiScamSimulator } from '../components/AntiScamSimulator'
import type { ActivityDifficulty, CryptoHeadline, MarketCoin, UserProfile } from '../types'

type DashboardTab = 'home' | 'wallet' | 'profile' | 'activities'

type DashboardPageProps = {
  user: UserProfile
  onLogout: () => void
}

export function DashboardPage({ user: initialUser, onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [user, setUser] = useState(initialUser)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return ((typeof window !== 'undefined' && localStorage.getItem('abracadabra.fontSize')) as any) || 'normal'
  })
  const [completedMissions, setCompletedMissions] = useState<string[]>(() => getCompletedMissions())
  const [missionToast, setMissionToast] = useState<string>('')

  function logout() {
    stopSpeaking()
    signOutDemo()
    onLogout()
  }

  function saveProfile(changes: Partial<UserProfile>) {
    const updatedUser = updateCurrentUser(changes)
    if (updatedUser) setUser(updatedUser)
  }

  function toggleFontSize() {
    const next = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal'
    setFontSize(next)
    localStorage.setItem('abracadabra.fontSize', next)
  }

  function triggerMission(missionId: string, customMsg?: string) {
    const res = completeMission(missionId)
    if (res.newlyCompleted) {
      setCompletedMissions(res.completedList)
      setMissionToast(customMsg || '🎉 Missão concluída com sucesso!')
      setTimeout(() => setMissionToast(''), 4500)
    }
  }

  const balance = user.practiceBalance ?? 2.5

  return (
    <main
      className={`dashboard-page ${fontSize === 'large' ? 'font-size-large' : fontSize === 'xlarge' ? 'font-size-xlarge' : ''}`}
    >
      <header className="dashboard-header">
        <a href="/" className="dashboard-logo-link">
          <img src="/logo-abracadabra.svg" alt="Abracadabra" />
        </a>
        <nav className="dashboard-nav" aria-label="Área do aluno">
          <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
            Mercado
          </button>
          <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => setActiveTab('wallet')}>
            Carteira Prática
          </button>
          <button className={activeTab === 'activities' ? 'active' : ''} onClick={() => setActiveTab('activities')}>
            Atividades
          </button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
            Perfil
          </button>
        </nav>

        <div className="dashboard-header-right">
          {/* Botão de acessibilidade / tamanho de letra */}
          <button
            type="button"
            className="accessibility-font-btn"
            onClick={toggleFontSize}
            title="Ajustar tamanho da letra para leitura mais confortável (A- / A+)"
          >
            <span className="font-symbol">Aa</span>
            <small>{fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Grande' : 'Muito Grande'}</small>
          </button>

          <button
            type="button"
            className="practice-wallet-badge"
            onClick={() => setActiveTab('wallet')}
            title="Sua Carteira de Prática Web3 (Solana Devnet)"
          >
            <span className="badge-pulse" />
            <span className="badge-icon">🧪</span>
            <span className="badge-balance">{balance.toFixed(2)} SOL</span>
            <span className="badge-net">Devnet</span>
          </button>

          <button className="dashboard-user" onClick={() => setActiveTab('profile')}>
            <span>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.displayName.slice(0, 1)}</span>
            {user.displayName}
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {missionToast && (
          <div className="mission-toast-banner" role="status">
            <span>✨</span>
            <strong>{missionToast}</strong>
          </div>
        )}

        {/* Trilha de Missões Guiadas do Aluno */}
        <StudentMissionsWidget
          completedMissions={completedMissions}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {activeTab === 'home' && <HomeDashboard user={user} onOpenWallet={() => setActiveTab('wallet')} />}
        {activeTab === 'wallet' && (
          <PracticeWalletPanel user={user} onSave={saveProfile} onTriggerMission={triggerMission} />
        )}
        {activeTab === 'profile' && (
          <ProfilePanel
            user={user}
            onSave={saveProfile}
            onLogout={logout}
            onOpenWallet={() => setActiveTab('wallet')}
            fontSize={fontSize}
            onToggleFontSize={toggleFontSize}
          />
        )}
        {activeTab === 'activities' && (
          <ActivitiesPanel user={user} onSave={saveProfile} onTriggerMission={triggerMission} />
        )}
      </div>
    </main>
  )
}

function HomeDashboard({ user, onOpenWallet }: { user: UserProfile; onOpenWallet: () => void }) {
  const [coins, setCoins] = useState<MarketCoin[]>([])
  const [selectedCoin, setSelectedCoin] = useState<MarketCoin | null>(null)
  const [headlines, setHeadlines] = useState<CryptoHeadline[]>([])
  const [loadingMarket, setLoadingMarket] = useState(true)
  const [loadingNews, setLoadingNews] = useState(false)
  const [error, setError] = useState('')

  const bestCoin = coins.reduce(
    (best, coin) => (coin.price_change_percentage_24h > (best?.price_change_percentage_24h ?? -Infinity) ? coin : best),
    null as MarketCoin | null
  )
  const worstCoin = coins.reduce(
    (worst, coin) => (coin.price_change_percentage_24h < (worst?.price_change_percentage_24h ?? Infinity) ? coin : worst),
    null as MarketCoin | null
  )
  const topCoin = coins[0]
  const balance = user.practiceBalance ?? 2.5

  useEffect(() => {
    getMarketCoins()
      .then(setCoins)
      .catch(() => setError('Não foi possível atualizar o mercado agora.'))
      .finally(() => setLoadingMarket(false))
  }, [])

  function selectCoin(coin: MarketCoin) {
    setSelectedCoin(coin)
    setLoadingNews(true)
    setHeadlines([])
    getRelatedHeadlines(coin)
      .then(setHeadlines)
      .catch(() => setError('Não foi possível carregar as manchetes relacionadas.'))
      .finally(() => setLoadingNews(false))
  }

  return (
    <>
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-kicker">ÁREA DO ALUNO</p>
          <h1>Olá, {user.displayName.split(' ')[0]}.</h1>
          <p>Acompanhe o mercado, pratique na sua carteira de treino e avance nos desafios práticos de Web3.</p>
          <div className="welcome-meta">
            <span>Dados ao vivo</span>
            <span>8 ativos acompanhados</span>
            <button type="button" className="welcome-wallet-chip" onClick={onOpenWallet}>
              🧪 Carteira de Treino: <strong>{balance.toFixed(2)} SOL</strong> →
            </button>
          </div>
        </div>
        <div className="market-brief">
          <div className="market-brief-heading">
            <span>RADAR DE HOJE</span>
            <small>24H</small>
          </div>
          {bestCoin && (
            <div className="brief-row">
              <span>
                <b className="brief-dot positive-dot" />
                Maior alta
              </span>
              <strong>
                {bestCoin.symbol.toUpperCase()} <em className="positive">{formatPercent(bestCoin.price_change_percentage_24h)}</em>
              </strong>
            </div>
          )}
          {worstCoin && (
            <div className="brief-row">
              <span>
                <b className="brief-dot negative-dot" />
                Maior queda
              </span>
              <strong>
                {worstCoin.symbol.toUpperCase()} <em className="negative">{formatPercent(worstCoin.price_change_percentage_24h)}</em>
              </strong>
            </div>
          )}
          {topCoin && (
            <div className="brief-row">
              <span>
                <b className="brief-dot purple-dot" />
                Líder por valor
              </span>
              <strong>
                {topCoin.symbol.toUpperCase()} <em>#{topCoin.market_cap_rank}</em>
              </strong>
            </div>
          )}
          <div className="brief-focus">
            <span>SUA CARTEIRA DE TESTE</span>
            <strong>{balance.toFixed(2)} SOL (Solana Devnet)</strong>
            <small>
              <button type="button" className="brief-link-action" onClick={onOpenWallet}>
                Acessar torneira (Faucet) e envio →
              </button>
            </small>
          </div>
        </div>
      </section>

      <section className="market-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-kicker">MERCADO CRIPTO</p>
            <h2>O que está se movendo.</h2>
          </div>
          <span className="content-note">Dados ao vivo · não é recomendação</span>
        </div>
        {error && <p className="api-error">{error}</p>}
        {loadingMarket ? (
          <p className="market-status">Carregando dados do mercado...</p>
        ) : (
          <div className="market-grid">
            {coins.map((coin) => (
              <button
                className={`market-card ${selectedCoin?.id === coin.id ? 'selected' : ''}`}
                key={coin.id}
                onClick={() => selectCoin(coin)}
              >
                <span className="coin-symbol">{coin.symbol.slice(0, 4)}</span>
                <span className="coin-name">{coin.name}</span>
                <strong>{formatPrice(coin.current_price)}</strong>
                <small className={coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>
                  {formatPercent(coin.price_change_percentage_24h)} hoje
                </small>
                <em>
                  #{coin.market_cap_rank} · cap. {formatMarketCap(coin.market_cap)}
                </em>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="related-news-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-kicker">CONTEXTO</p>
            <h2>{selectedCoin ? `Notícias sobre ${selectedCoin.name}.` : 'Escolha uma cripto.'}</h2>
          </div>
          <span className="content-note">Manchetes + link original</span>
        </div>
        {!selectedCoin && <p className="market-status">Selecione um ativo acima para buscar manchetes relacionadas.</p>}
        {loadingNews && <p className="market-status">Buscando manchetes relacionadas...</p>}
        {!loadingNews && selectedCoin && headlines.length === 0 && (
          <p className="market-status">Nenhuma manchete encontrada para este ativo.</p>
        )}
        {!loadingNews && headlines.length > 0 && (
          <div className="headline-list">
            {headlines.map((headline) => (
              <a className="headline-item" href={headline.url} target="_blank" rel="noreferrer" key={headline.id}>
                <div>
                  <span>
                    {headline.source} · {formatDate(headline.publishedAt)}
                  </span>
                  <h3>{headline.title}</h3>
                </div>
                <b>↗</b>
              </a>
            ))}
          </div>
        )}
        <p className="rights-note">
          Manchetes e links pertencem às fontes originais. O Abracadabra exibe apenas metadados e não reproduz o conteúdo das
          matérias. Dados via{' '}
          <a href="https://cryptocurrency.cv/" target="_blank" rel="noreferrer">
            Crypto Vision News
          </a>
          .
        </p>
      </section>
    </>
  )
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatMarketCap(value: number) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

function formatDate(value: string) {
  if (!value) return 'agora'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value))
}

function formatTxDate(isoString: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString))
  } catch {
    return 'Agora'
  }
}

function PracticeWalletPanel({
  user,
  onSave,
  onTriggerMission,
}: {
  user: UserProfile
  onSave: (changes: Partial<UserProfile>) => void
  onTriggerMission: (missionId: string, msg?: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [faucetLoading, setFaucetLoading] = useState(false)
  const [faucetNotice, setFaucetNotice] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferResult, setTransferResult] = useState<{ success: boolean; msg: string; sig?: string } | null>(null)
  const [resetNotice, setResetNotice] = useState('')
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  const balance = user.practiceBalance ?? 2.5
  const address = user.walletAddress || 'Abr4CadAbRaDevnEtWaLLeT99182374619283741234'
  const txList = user.practiceTransactions || []
  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0
  const maxSendable = Math.max(0, Number((balance - 0.000005).toFixed(6)))

  function toggleSpeech(id: string, text: string) {
    if (speakingId === id) {
      stopSpeaking()
      setSpeakingId(null)
    } else {
      stopSpeaking()
      setSpeakingId(id)
      speakText(text, {
        onEnd: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      })
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(address)
    setCopied(true)
    onTriggerMission(
      'mission_explore_wallet',
      '🎉 Missão 1 Concluída: Você conheceu sua Chave Pública (o seu Pix Cripto)!'
    )
    setTimeout(() => setCopied(false), 2200)
  }

  function handleFaucet() {
    if (faucetLoading) return
    setFaucetLoading(true)
    setFaucetNotice('')
    setTimeout(() => {
      const { updatedUser, transaction } = claimPracticeFaucet(user, 1.0)
      onSave({
        practiceBalance: updatedUser.practiceBalance,
        practiceTransactions: updatedUser.practiceTransactions,
      })
      setFaucetLoading(false)
      setFaucetNotice(`🎉 +1.00 SOL recebido com sucesso via Devnet Faucet! Hash: ${transaction.signature.slice(0, 12)}...`)
      onTriggerMission('mission_claim_faucet', '🎉 Missão 2 Concluída: Você pegou moedas na Torneira (Faucet)!')
      setTimeout(() => setFaucetNotice(''), 4500)
    }, 600)
  }

  function handleSendSimulation(e: FormEvent) {
    e.preventDefault()
    if (transferLoading) return
    setTransferResult(null)

    const cleanRecipient = recipient.trim()
    if (!cleanRecipient) {
      setTransferResult({ success: false, msg: 'Informe ou selecione a chave pública do destinatário.' })
      return
    }

    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferResult({ success: false, msg: 'Informe um valor válido em SOL para transferir.' })
      return
    }

    setTransferLoading(true)
    setTimeout(() => {
      const res = sendPracticeSol(user, cleanRecipient, numAmount)
      setTransferLoading(false)
      if (res.success && res.updatedUser && res.transaction) {
        onSave({
          practiceBalance: res.updatedUser.practiceBalance,
          practiceTransactions: res.updatedUser.practiceTransactions,
        })
        const note = res.adjustedNotice ? ` (${res.adjustedNotice})` : ''
        setTransferResult({
          success: true,
          msg: `Transferência simulada de ${res.transaction.amount.toFixed(6)} SOL confirmada com sucesso na Solana Devnet!${note}`,
          sig: res.transaction.signature,
        })
        setRecipient('')
        setAmount('')
        onTriggerMission('mission_send_simulation', '🎉 Missão 3 Concluída: Você fez sua primeira transferência on-chain!')
      } else {
        setTransferResult({
          success: false,
          msg: res.error || 'Erro ao processar transferência simulada.',
        })
      }
    }, 800)
  }

  function handleReset() {
    if (
      window.confirm(
        'Deseja resetar sua carteira de prática? Isso gerará uma nova chave pública e redefinirá o saldo de teste para 2.50 SOL.'
      )
    ) {
      const resetUser = resetPracticeWallet(user)
      onSave({
        walletAddress: resetUser.walletAddress,
        practiceBalance: resetUser.practiceBalance,
        practiceTransactions: resetUser.practiceTransactions,
      })
      setResetNotice('Carteira de prática reiniciada com novo endereço e 2.50 SOL!')
      setTimeout(() => setResetNotice(''), 3500)
    }
  }

  return (
    <section className="panel-page wallet-page">
      <div className="wallet-header-block">
        <p className="dashboard-kicker">SIMULADOR ON-CHAIN · AMBIENTE SEGURO DE APRENDIZADO</p>
        <h1>Carteira de Prática</h1>
        <p className="panel-lead">
          Esta é a sua carteira Web3 simulada. Nela você experimenta a tecnologia da Solana sem risco ou dinheiro real,
          entendendo como funcionam chaves públicas, transferências, taxas e airdrops.
        </p>
      </div>

      {/* Cartão de Destaque da Carteira */}
      <div className="wallet-card-showcase">
        <div className="wallet-card-chip-row">
          <div className="wallet-network-tag">
            <span className="dot-live" />
            <span>Solana Devnet (Simulada)</span>
          </div>
          <div className="wallet-security-tag">
            <span>🛡️ Sandbox Educacional · Sem Dinheiro Real</span>
          </div>
        </div>

        <div className="wallet-balance-row">
          <div>
            <span className="wallet-balance-label">SALDO DISPONÍVEL</span>
            <div className="wallet-balance-value">
              <strong>{balance.toFixed(4)}</strong>
              <span>SOL</span>
            </div>
            <small className="wallet-balance-usd">
              ≈ {(balance * 145).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (cotação simulada)
            </small>
          </div>

          <div className="wallet-card-actions">
            <button type="button" className="faucet-button" onClick={handleFaucet} disabled={faucetLoading}>
              {faucetLoading ? '⏳ Solicitando Faucet...' : '💧 Pedir +1.0 SOL de Teste (Faucet)'}
            </button>
            <button
              type="button"
              className="wallet-reset-btn"
              onClick={handleReset}
              title="Resetar carteira para o estado inicial"
            >
              🔄 Resetar
            </button>
          </div>
        </div>

        <div className="wallet-address-bar">
          <div className="address-info">
            <span className="address-label">CHAVE PÚBLICA (ENDEREÇO DA SUA CARTEIRA / PIX CRIPTO):</span>
            <code className="address-code">{address}</code>
          </div>
          <button type="button" className="copy-address-btn" onClick={copyAddress} title="Copiar endereço completo">
            {copied ? '✓ Copiado!' : '📋 Copiar Chave'}
          </button>
        </div>

        {faucetNotice && <div className="wallet-notice-banner success">{faucetNotice}</div>}
        {resetNotice && <div className="wallet-notice-banner info">{resetNotice}</div>}
      </div>

      {/* Seção Nova: Tradutor do Cotidiano (Analogias do Mundo Real) */}
      <div className="analogies-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-kicker">TRADUTOR DO COTIDIANO</p>
            <h2>Entenda Cripto com o que Você Já Usa Todo Dia.</h2>
          </div>
          <span className="content-note">Comparações familiares · Clique em Ouvir para escutar</span>
        </div>

        <div className="analogies-grid">
          <article className={`analogy-card ${speakingId === 'analogy-pix' ? 'speaking' : ''}`}>
            <div className="analogy-top">
              <span className="analogy-icon">🔑</span>
              <span className="analogy-tag">Como o Pix</span>
            </div>
            <h3>Chave Pública = Sua Chave Pix</h3>
            <p>
              É o endereço da sua carteira (como seu Pix de e-mail ou CPF). Você pode passar para qualquer pessoa
              sem medo para receber moedas. Ninguém consegue tirar dinheiro de você apenas sabendo seu endereço.
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn-speak-analogy"
                onClick={() =>
                  toggleSpeech(
                    'analogy-pix',
                    'Chave Pública é como a sua Chave Pix. É o endereço da sua carteira. Você pode passar para qualquer pessoa sem medo para receber moedas. Ninguém consegue tirar dinheiro de você apenas sabendo o seu endereço público.'
                  )
                }
              >
                {speakingId === 'analogy-pix' ? '⏹️ Parar' : '🔊 Ouvir'}
              </button>
            )}
          </article>

          <article className={`analogy-card ${speakingId === 'analogy-senha' ? 'speaking' : ''}`}>
            <div className="analogy-top">
              <span className="analogy-icon">🔐</span>
              <span className="analogy-tag">Como a Senha</span>
            </div>
            <h3>Chave Privada = Senha do Cartão</h3>
            <p>
              São as suas 12 palavras secretas (ou senha mestra). Quem tem essa chave consegue movimentar seus fundos.
              Por isso, você <em>NUNCA</em> entrega para ninguém, nem para suporte, amigos ou atendentes.
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn-speak-analogy"
                onClick={() =>
                  toggleSpeech(
                    'analogy-senha',
                    'Chave Privada é como a senha de seis dígitos do seu cartão ou a chave do seu cofre. Quem tem essa chave consegue movimentar seu dinheiro. Por isso, você nunca entrega para ninguém, nem para o gerente do banco ou suporte.'
                  )
                }
              >
                {speakingId === 'analogy-senha' ? '⏹️ Parar' : '🔊 Ouvir'}
              </button>
            )}
          </article>

          <article className={`analogy-card ${speakingId === 'analogy-cartorio' ? 'speaking' : ''}`}>
            <div className="analogy-top">
              <span className="analogy-icon">📜</span>
              <span className="analogy-tag">Como o Cartório</span>
            </div>
            <h3>Blockchain = Cartório Digital</h3>
            <p>
              Imagine um livro de registros público carimbado por milhares de computadores ao redor do mundo. Depois que uma
              transferência entra no bloco, é impossível apagar ou falsificar.
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn-speak-analogy"
                onClick={() =>
                  toggleSpeech(
                    'analogy-cartorio',
                    'Blockchain é como um cartório comunitário digital. Imagine um livro de registros carimbado por milhares de computadores. Depois que uma transação entra no bloco, ninguém consegue alterar ou apagar o que já foi registrado.'
                  )
                }
              >
                {speakingId === 'analogy-cartorio' ? '⏹️ Parar' : '🔊 Ouvir'}
              </button>
            )}
          </article>

          <article className={`analogy-card ${speakingId === 'analogy-selo' ? 'speaking' : ''}`}>
            <div className="analogy-top">
              <span className="analogy-icon">⛽</span>
              <span className="analogy-tag">Como o Frete</span>
            </div>
            <h3>Gas Fee = Selo dos Correios</h3>
            <p>
              Para mandar uma carta, você compra um selo. Na blockchain, para mandar moedas, você paga uma fração minúscula de
              trocado para os computadores que conferem e transportam sua transação.
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn-speak-analogy"
                onClick={() =>
                  toggleSpeech(
                    'analogy-selo',
                    'Gas Fee, ou taxa de rede, é como o selo dos Correios ou a taxa de entrega. É um trocadinho minúsculo pago para quem processa e entrega sua transferência com segurança na rede.'
                  )
                }
              >
                {speakingId === 'analogy-selo' ? '⏹️ Parar' : '🔊 Ouvir'}
              </button>
            )}
          </article>

          <article className={`analogy-card ${speakingId === 'analogy-maquina' ? 'speaking' : ''}`}>
            <div className="analogy-top">
              <span className="analogy-icon">🤖</span>
              <span className="analogy-tag">Como a Vending Machine</span>
            </div>
            <h3>Smart Contract = Máquina de Refrigerante</h3>
            <p>
              Um programa que roda sozinho: você insere a moeda, aperta o botão e o refrigerante cai na hora, sem precisar
              de um atendente humano intermediando a compra.
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn-speak-analogy"
                onClick={() =>
                  toggleSpeech(
                    'analogy-maquina',
                    'Contrato Inteligente é como uma máquina de refrigerante automática. Você coloca a moeda, aperta o botão e o refrigerante cai na hora, sem precisar de nenhum intermediário humano para liberar o produto.'
                  )
                }
              >
                {speakingId === 'analogy-maquina' ? '⏹️ Parar' : '🔊 Ouvir'}
              </button>
            )}
          </article>
        </div>
      </div>

      {/* Grid do Laboratório: Formulário de Envio e Guia Educacional */}
      <div className="wallet-lab-grid">
        {/* Formulário de Envio Simulado */}
        <div className="lab-panel send-panel">
          <div className="panel-title-row">
            <span className="panel-icon">📤</span>
            <div>
              <h3>Simular Transferência On-Chain</h3>
              <p>Envie SOL de teste para outro endereço e veja como a rede valida a transação.</p>
            </div>
          </div>

          <form onSubmit={handleSendSimulation} noValidate className="send-form">
            <label className="field-label">
              <span>Destinatário (Chave Pública)</span>
              <input
                type="text"
                placeholder="Insira a chave pública de destino..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </label>

            <div className="sample-recipients-box">
              <span className="sample-label">Ou escolha um destinatário de teste da turma:</span>
              <div className="sample-recipients-list">
                {SAMPLE_RECIPIENTS.map((item) => (
                  <button
                    key={item.address}
                    type="button"
                    className="sample-recipient-pill"
                    onClick={() => setRecipient(item.address)}
                  >
                    <strong>{item.name}</strong>
                    <small>
                      {item.address.slice(0, 4)}...{item.address.slice(-4)}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <label className="field-label">
              <span>Valor da Transferência (SOL)</span>
              <div className="amount-input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 0.1"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.')
                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                      setAmount(val)
                    }
                  }}
                />
                <span className="amount-suffix">SOL</span>
              </div>
            </label>

            <div className="quick-amount-buttons">
              <button type="button" onClick={() => setAmount('0.1')}>
                0.1 SOL
              </button>
              <button type="button" onClick={() => setAmount('0.5')}>
                0.5 SOL
              </button>
              <button type="button" onClick={() => setAmount('1.0')}>
                1.0 SOL
              </button>
              <button
                type="button"
                onClick={() => setAmount(maxSendable > 0 ? maxSendable.toString() : '0')}
              >
                Máximo
              </button>
            </div>

            {/* Breakdown de custos */}
            <div className="tx-breakdown">
              <div className="breakdown-row">
                <span>Valor enviado:</span>
                <strong>{parsedAmount > 0 ? `${parsedAmount} SOL` : '0 SOL'}</strong>
              </div>
              <div className="breakdown-row">
                <span>Taxa de rede estimada (Gas Fee):</span>
                <span className="fee-value">0.000005 SOL (~5.000 lamports)</span>
              </div>
              <div className="breakdown-divider" />
              <div className="breakdown-row total">
                <span>Total a debitar:</span>
                <strong>{parsedAmount > 0 ? `${(parsedAmount + 0.000005).toFixed(6)} SOL` : '0.000005 SOL'}</strong>
              </div>
            </div>

            {parsedAmount + 0.000005 > balance && parsedAmount > 0 && maxSendable > 0 && (
              <div className="fee-notice-pill">
                <span>💡 Para enviar tudo descontando a taxa, use <strong>{maxSendable} SOL</strong></span>
                <button
                  type="button"
                  onClick={() => setAmount(maxSendable.toString())}
                >
                  Ajustar
                </button>
              </div>
            )}

            <button type="submit" className="confirm-send-btn" disabled={transferLoading || !recipient || !amount}>
              {transferLoading ? '⏳ Processando bloco na Devnet...' : '🚀 Confirmar Envio Simulado'}
            </button>

            {transferResult && (
              <div className={`transfer-result ${transferResult.success ? 'success' : 'error'}`}>
                <p>{transferResult.msg}</p>
                {transferResult.sig && (
                  <div className="result-sig">
                    <small>Assinatura on-chain:</small>
                    <code>
                      {transferResult.sig.slice(0, 16)}...{transferResult.sig.slice(-16)}
                    </code>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Guia Didático Web3 */}
        <div className="lab-panel guide-panel">
          <div className="panel-title-row">
            <span className="panel-icon">💡</span>
            <div>
              <h3>Guia do Aluno: Como a Carteira Funciona</h3>
              <p>Conceitos fundamentais que todo iniciante em Web3 precisa dominar.</p>
            </div>
          </div>

          <div className="edu-tips-list">
            <article className={`edu-tip-card ${speakingId === 'tip-1' ? 'speaking' : ''}`}>
              <div className="tip-header">
                <span className="tip-num">01</span>
                <h4>Chave Pública vs. Chave Privada</h4>
                {isSpeechSupported() && (
                  <button
                    type="button"
                    className="btn-mini-audio"
                    onClick={() =>
                      toggleSpeech(
                        'tip-1',
                        'Sua Chave Pública é como a chave Pix. Você pode compartilhar livremente para receber fundos. Já a Chave Privada é a sua assinatura secreta que autoriza pagamentos e ela nunca deve ser compartilhada com ninguém.'
                      )
                    }
                  >
                    {speakingId === 'tip-1' ? '⏹️' : '🔊'}
                  </button>
                )}
              </div>
              <p>
                Sua <strong>Chave Pública</strong> é o endereço acima (como seu Pix ou número da conta). Você pode
                compartilhar livremente para receber moedas. Já a <strong>Chave Privada</strong> (ou Seed Phrase) é a sua
                assinatura secreta que autoriza movimentações — ela <em>nunca</em> deve ser compartilhada.
              </p>
            </article>

            <article className={`edu-tip-card ${speakingId === 'tip-2' ? 'speaking' : ''}`}>
              <div className="tip-header">
                <span className="tip-num">02</span>
                <h4>O que é a Devnet?</h4>
                {isSpeechSupported() && (
                  <button
                    type="button"
                    className="btn-mini-audio"
                    onClick={() =>
                      toggleSpeech(
                        'tip-2',
                        'A Solana possui redes de teste, chamadas Devnet e Testnet, com tecnologia idêntica à rede principal, mas com moedas sem valor monetário. É o ambiente perfeito para estudantes praticarem sem risco de perder dinheiro.'
                      )
                    }
                  >
                    {speakingId === 'tip-2' ? '⏹️' : '🔊'}
                  </button>
                )}
              </div>
              <p>
                A Solana possui redes de teste (Devnet e Testnet) com tecnologia idêntica à rede principal (Mainnet), mas com
                moedas sem valor monetário. É o ambiente perfeito para estudantes e desenvolvedores praticarem sem risco.
              </p>
            </article>

            <article className={`edu-tip-card ${speakingId === 'tip-3' ? 'speaking' : ''}`}>
              <div className="tip-header">
                <span className="tip-num">03</span>
                <h4>O que é o Faucet?</h4>
                {isSpeechSupported() && (
                  <button
                    type="button"
                    className="btn-mini-audio"
                    onClick={() =>
                      toggleSpeech(
                        'tip-3',
                        'Faucet significa torneira. Em redes de teste, são serviços que distribuem frações gratuitas de moedas de teste para quem precisa praticar e aprender.'
                      )
                    }
                  >
                    {speakingId === 'tip-3' ? '⏹️' : '🔊'}
                  </button>
                )}
              </div>
              <p>
                "Faucet" significa torneira. Em redes de teste Web3, faucets são serviços que distribuem frações gratuitas de
                criptomoedas de teste para quem precisa praticar e rodar simulações.
              </p>
            </article>

            <article className={`edu-tip-card ${speakingId === 'tip-4' ? 'speaking' : ''}`}>
              <div className="tip-header">
                <span className="tip-num">04</span>
                <h4>Taxas de Rede (Gas Fee)</h4>
                {isSpeechSupported() && (
                  <button
                    type="button"
                    className="btn-mini-audio"
                    onClick={() =>
                      toggleSpeech(
                        'tip-4',
                        'Na blockchain não existe servidor central. Milhares de computadores validadores processam transações. A taxa de rede recompensa esses computadores por garantirem a segurança do sistema.'
                      )
                    }
                  >
                    {speakingId === 'tip-4' ? '⏹️' : '🔊'}
                  </button>
                )}
              </div>
              <p>
                Na blockchain não existe servidor central. Milhares de computadores (validadores) processam transações. A taxa
                de rede (uma fração minúscula de SOL) recompensa esses computadores por garantirem a segurança da rede.
              </p>
            </article>
          </div>
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className="tx-history-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-kicker">LIVRO-RAZÃO SIMULADO</p>
            <h2>Histórico de Transações On-Chain</h2>
          </div>
          <span className="content-note">{txList.length} transação(ões) registradas</span>
        </div>

        {txList.length === 0 ? (
          <p className="market-status">Nenhuma transação registrada nesta sessão ainda.</p>
        ) : (
          <div className="tx-cards-list">
            {txList.map((tx) => (
              <div key={tx.id} className={`tx-card ${tx.type}`}>
                <div className="tx-type-col">
                  <span className="tx-type-icon">
                    {tx.type === 'faucet' ? '💧' : tx.type === 'send' ? '📤' : tx.type === 'reward' ? '🏆' : '📥'}
                  </span>
                  <div>
                    <strong>
                      {tx.type === 'faucet'
                        ? 'Devnet Faucet'
                        : tx.type === 'send'
                        ? 'Envio Transferido'
                        : tx.type === 'reward'
                        ? 'Recompensa de Estudo'
                        : 'Recebimento'}
                    </strong>
                    <small>{formatTxDate(tx.timestamp)}</small>
                  </div>
                </div>

                <div className="tx-dest-col">
                  <span className="col-label">Origem / Destino</span>
                  <code>{tx.toOrFrom.length > 28 ? `${tx.toOrFrom.slice(0, 14)}...${tx.toOrFrom.slice(-8)}` : tx.toOrFrom}</code>
                </div>

                <div className="tx-sig-col">
                  <span className="col-label">Assinatura (Hash)</span>
                  <code>
                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                  </code>
                </div>

                <div className="tx-amount-col">
                  <strong className={tx.type === 'send' ? 'amount-negative' : 'amount-positive'}>
                    {tx.type === 'send' ? `-${tx.amount.toFixed(4)} SOL` : `+${tx.amount.toFixed(4)} SOL`}
                  </strong>
                  {typeof tx.fee === 'number' && tx.fee > 0 && <small className="tx-fee">Taxa: {tx.fee.toFixed(6)} SOL</small>}
                </div>

                <div className="tx-status-col">
                  <span className="status-badge confirmed">🟢 Confirmada</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ProfilePanel({
  user,
  onSave,
  onLogout,
  onOpenWallet,
  fontSize,
  onToggleFontSize,
}: DashboardPageProps & {
  onSave: (changes: Partial<UserProfile>) => void
  onOpenWallet: () => void
  fontSize: 'normal' | 'large' | 'xlarge'
  onToggleFontSize: () => void
}) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio)
  const [focus, setFocus] = useState(user.preferences.focus)
  const [weeklyDigest, setWeeklyDigest] = useState(user.preferences.weeklyDigest)
  const [saved, setSaved] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState(false)

  const balance = user.practiceBalance ?? 2.5
  const address = user.walletAddress || 'Abr4CadAbRaDevnEtWaLLeT99182374619283741234'

  function saveChanges() {
    onSave({
      displayName: displayName.trim() || user.displayName,
      bio: bio.trim(),
      preferences: { focus, weeklyDigest },
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onSave({ avatarUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  function copyProfileAddress() {
    navigator.clipboard.writeText(address)
    setCopiedAddr(true)
    setTimeout(() => setCopiedAddr(false), 2000)
  }

  return (
    <section className="panel-page profile-page">
      <p className="dashboard-kicker">SEU ESPAÇO</p>
      <h1>Perfil &amp; Preferências</h1>
      <p className="panel-lead">
        Personalize como você aparece dentro do Abracadabra e configure preferências de acessibilidade e estudo.
      </p>

      {/* Card da Carteira de Prática no Perfil */}
      <div className="profile-wallet-card">
        <div className="profile-wallet-header">
          <div className="profile-wallet-info">
            <span className="profile-wallet-badge">🧪 CARTEIRA DE PRÁTICA WEB3</span>
            <h3>{user.walletProvider || 'Solana Devnet (Simulada)'}</h3>
            <p>Sua carteira de treino pessoal para aprender e simular transações.</p>
          </div>
          <div className="profile-wallet-balance">
            <span>SALDO DISPONÍVEL</span>
            <strong>{balance.toFixed(4)} SOL</strong>
          </div>
        </div>

        <div className="profile-wallet-addr-row">
          <div className="addr-wrap">
            <small>Chave Pública (Pix Cripto):</small>
            <code>{address}</code>
          </div>
          <div className="addr-btns">
            <button type="button" className="btn-copy-addr" onClick={copyProfileAddress}>
              {copiedAddr ? '✓ Copiado' : '📋 Copiar'}
            </button>
            <button type="button" className="btn-open-wallet" onClick={onOpenWallet}>
              Abrir Simulador →
            </button>
          </div>
        </div>
      </div>

      {/* Card de Acessibilidade */}
      <div className="profile-accessibility-box">
        <div className="accessibility-box-left">
          <span className="acc-icon">👓</span>
          <div>
            <strong>Acessibilidade Visual (Tamanho da Letra)</strong>
            <p>Ajuste o tamanho das fontes em toda a plataforma para uma leitura mais descansada.</p>
          </div>
        </div>
        <button type="button" className="btn-toggle-font-profile" onClick={onToggleFontSize}>
          Tamanho Atual: <strong>{fontSize === 'normal' ? 'Normal (100%)' : fontSize === 'large' ? 'Grande (115%)' : 'Muito Grande (130%)'}</strong> (Clique para mudar)
        </button>
      </div>

      <div className="profile-editor">
        <div className="profile-editor-top">
          <label className="profile-avatar large-avatar" htmlFor="avatar-upload">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="Sua foto" /> : user.displayName.slice(0, 1)}
            <span>Trocar foto</span>
          </label>
          <input id="avatar-upload" className="visually-hidden" type="file" accept="image/*" onChange={uploadAvatar} />
          <div>
            <h2>{user.displayName}</h2>
            <p>@{user.username}</p>
            {user.email && <small className="profile-email-badge">✉️ {user.email}</small>}
          </div>
        </div>
        <div className="profile-fields">
          <label>
            Nome de exibição
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label>
            Bio
            <textarea value={bio} rows={3} onChange={(event) => setBio(event.target.value)} />
          </label>
          <label>
            Meu foco
            <select value={focus} onChange={(event) => setFocus(event.target.value)}>
              <option>Fundamentos de Web3</option>
              <option>Solana e ecossistema</option>
              <option>Construção de projetos</option>
              <option>Cripto e mercado</option>
            </select>
          </label>
          <label className="preference-toggle">
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(event) => setWeeklyDigest(event.target.checked)}
            />
            <span>
              <strong>Resumo semanal</strong>
              <small>Receber uma seleção dos principais conteúdos para continuar descobrindo.</small>
            </span>
          </label>
        </div>
        <div className="profile-editor-actions">
          <button className="save-profile" onClick={saveChanges}>
            Salvar alterações
          </button>
          {saved && <span className="saved-message">Perfil salvo neste navegador.</span>}
        </div>
      </div>
      <button className="logout-button" onClick={onLogout}>
        Sair da conta
      </button>
    </section>
  )
}

function ActivitiesPanel({
  user,
  onSave,
  onTriggerMission,
}: {
  user: UserProfile
  onSave: (changes: Partial<UserProfile>) => void
  onTriggerMission: (missionId: string, msg?: string) => void
}) {
  const [activityMode, setActivityMode] = useState<'quiz' | 'antiscam'>('quiz')
  const [difficulty, setDifficulty] = useState<ActivityDifficulty>('iniciante')
  const [question, setQuestion] = useState(() => createQuestion('iniciante'))
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [progress, setProgress] = useState(getActivityProgress())
  const [feedback, setFeedback] = useState(false)
  const level = getLevelFromXp(progress.xp)

  function changeDifficulty(nextDifficulty: ActivityDifficulty) {
    setDifficulty(nextDifficulty)
    setQuestion(createQuestion(nextDifficulty))
    setSelectedAnswer(null)
    setFeedback(false)
  }

  function answer(index: number) {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    const correct = index === question.answerIndex
    const nextProgress = recordAnswer(correct, question.xp)
    setProgress(nextProgress)
    setFeedback(true)

    if (correct) {
      // Learn & Earn: Recompensa de 0.05 SOL simulado na carteira de treino
      const { updatedUser } = rewardPracticeActivity(user, 0.05, `Atividade: ${question.category}`)
      onSave({
        xp: nextProgress.xp,
        completedActivities: nextProgress.completed,
        level: getLevelFromXp(nextProgress.xp).label,
        practiceBalance: updatedUser.practiceBalance,
        practiceTransactions: updatedUser.practiceTransactions,
      })
      onTriggerMission('mission_answer_quiz', '🎉 Missão 4 Concluída: Você acertou uma questão no Laboratório!')
    } else {
      onSave({
        xp: nextProgress.xp,
        completedActivities: nextProgress.completed,
        level: getLevelFromXp(nextProgress.xp).label,
      })
    }
  }

  function nextQuestion() {
    setQuestion(createQuestion(difficulty))
    setSelectedAnswer(null)
    setFeedback(false)
  }

  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0
  const xpToNext = Math.max(level.next - progress.xp, 0)

  return (
    <section className="activities-page">
      <div className="activities-heading">
        <div>
          <p className="dashboard-kicker">LABORATÓRIO DE PRÁTICA &amp; SEGURANÇA</p>
          <h1>Aprenda fazendo.</h1>
          <p className="panel-lead">
            Treine seu raciocínio com perguntas progressivas de Web3 ou pratique o simulador de proteção contra fraudes e
            golpes da internet.
          </p>
        </div>
        <div className="xp-card">
          <span>XP TOTAL</span>
          <strong>{progress.xp}</strong>
          <small>{xpToNext ? `${xpToNext} XP até o próximo nível` : 'Nível máximo da demo'}</small>
        </div>
      </div>

      {/* Seletor de Modo: Quiz vs Simulador Anti-Golpe */}
      <div className="activity-mode-pills">
        <button
          type="button"
          className={`mode-pill-btn ${activityMode === 'quiz' ? 'active' : ''}`}
          onClick={() => setActivityMode('quiz')}
        >
          🧪 Quiz de Conhecimento (+XP &amp; SOL)
        </button>
        <button
          type="button"
          className={`mode-pill-btn ${activityMode === 'antiscam' ? 'active' : ''}`}
          onClick={() => setActivityMode('antiscam')}
        >
          🛡️ Simulador Anti-Golpe (Cilada ou Seguro?)
        </button>
      </div>

      {activityMode === 'antiscam' ? (
        <AntiScamSimulator
          onComplete={() => {
            onTriggerMission('mission_security_test', '🏆 Missão 5 Concluída: Escudo Anti-Golpe conquistado!')
          }}
        />
      ) : (
        <>
          <div className="activity-stats">
            <div>
              <span>NÍVEL ATUAL</span>
              <strong>{level.label}</strong>
            </div>
            <div>
              <span>RESPONDIDAS</span>
              <strong>{progress.answered}</strong>
            </div>
            <div>
              <span>APROVEITAMENTO</span>
              <strong>{accuracy}%</strong>
            </div>
            <div>
              <span>SEQUÊNCIA</span>
              <strong>{user.streak} dia</strong>
            </div>
          </div>
          <div className="difficulty-tabs">
            <span>DIFICULDADE</span>
            {(['iniciante', 'intermediario', 'avancado'] as ActivityDifficulty[]).map((option) => (
              <button
                key={option}
                className={difficulty === option ? 'active' : ''}
                onClick={() => changeDifficulty(option)}
              >
                {option === 'intermediario' ? 'Intermediário' : option === 'avancado' ? 'Avançado' : 'Iniciante'}
              </button>
            ))}
          </div>
          <article className="question-card">
            <div className="question-meta">
              <span>{question.category}</span>
              <span className="reward-tag">+{question.xp} XP &amp; +0.05 SOL</span>
            </div>
            <p className="question-count">QUESTÃO GERADA · {question.difficulty}</p>
            <h2>{question.prompt}</h2>
            <div className="answer-grid">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  className={
                    selectedAnswer === null
                      ? ''
                      : index === question.answerIndex
                      ? 'correct'
                      : index === selectedAnswer
                      ? 'incorrect'
                      : 'muted'
                  }
                  onClick={() => answer(index)}
                >
                  {option}
                </button>
              ))}
            </div>
            {feedback && (
              <div className={`answer-feedback ${selectedAnswer === question.answerIndex ? 'success' : 'failure'}`}>
                <strong>
                  {selectedAnswer === question.answerIndex
                    ? `Mandou bem! +${question.xp} XP e +0.05 SOL creditados na sua carteira.`
                    : 'Ainda não.'}
                </strong>
                <span>{question.explanation}</span>
                <button onClick={nextQuestion}>Próxima questão →</button>
              </div>
            )}
          </article>
          <p className="activity-footnote">
            As questões são geradas a partir de combinações de conceitos, cenários e níveis. Cada resposta correta gera uma
            recompensa Learn &amp; Earn creditada diretamente na sua Carteira de Prática.
          </p>
        </>
      )}
    </section>
  )
}
