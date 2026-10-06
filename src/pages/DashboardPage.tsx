import { ChangeEvent, useEffect, useState } from 'react'
import { getMarketCoins, getRelatedHeadlines } from '../lib/cryptoApi'
import { signOutDemo, updateCurrentUser } from '../lib/demoAuth'
import { createQuestion, getActivityProgress, getLevelFromXp, recordAnswer } from '../lib/activityEngine'
import type { ActivityDifficulty, CryptoHeadline, MarketCoin, UserProfile } from '../types'

type DashboardTab = 'home' | 'profile' | 'activities'

type DashboardPageProps = {
  user: UserProfile
  onLogout: () => void
}

export function DashboardPage({ user: initialUser, onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [user, setUser] = useState(initialUser)

  function logout() {
    signOutDemo()
    onLogout()
  }

  function saveProfile(changes: Partial<UserProfile>) {
    const updatedUser = updateCurrentUser(changes)
    if (updatedUser) setUser(updatedUser)
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/" className="dashboard-logo-link"><img src="/logo-abracadabra.svg" alt="Abracadabra" /></a>
        <nav className="dashboard-nav" aria-label="Área do aluno">
          <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>Mercado</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Perfil</button>
          <button className={activeTab === 'activities' ? 'active' : ''} onClick={() => setActiveTab('activities')}>Atividades</button>
        </nav>
        <button className="dashboard-user" onClick={() => setActiveTab('profile')}><span>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.displayName.slice(0, 1)}</span>{user.displayName}</button>
      </header>

      <div className="dashboard-content">
        {activeTab === 'home' && <HomeDashboard user={user} />}
        {activeTab === 'profile' && <ProfilePanel user={user} onSave={saveProfile} onLogout={logout} />}
        {activeTab === 'activities' && <ActivitiesPanel user={user} onSave={saveProfile} />}
      </div>
    </main>
  )
}

function HomeDashboard({ user }: { user: UserProfile }) {
  const [coins, setCoins] = useState<MarketCoin[]>([])
  const [selectedCoin, setSelectedCoin] = useState<MarketCoin | null>(null)
  const [headlines, setHeadlines] = useState<CryptoHeadline[]>([])
  const [loadingMarket, setLoadingMarket] = useState(true)
  const [loadingNews, setLoadingNews] = useState(false)
  const [error, setError] = useState('')
  const bestCoin = coins.reduce((best, coin) => coin.price_change_percentage_24h > (best?.price_change_percentage_24h ?? -Infinity) ? coin : best, null as MarketCoin | null)
  const worstCoin = coins.reduce((worst, coin) => coin.price_change_percentage_24h < (worst?.price_change_percentage_24h ?? Infinity) ? coin : worst, null as MarketCoin | null)
  const topCoin = coins[0]

  useEffect(() => {
    getMarketCoins().then(setCoins).catch(() => setError('Não foi possível atualizar o mercado agora.')).finally(() => setLoadingMarket(false))
  }, [])

  function selectCoin(coin: MarketCoin) {
    setSelectedCoin(coin)
    setLoadingNews(true)
    setHeadlines([])
    getRelatedHeadlines(coin).then(setHeadlines).catch(() => setError('Não foi possível carregar as manchetes relacionadas.')).finally(() => setLoadingNews(false))
  }

  return <>
    <section className="dashboard-welcome"><div><p className="dashboard-kicker">ÁREA DO ALUNO</p><h1>Olá, {user.displayName.split(' ')[0]}.</h1><p>Acompanhe o mercado, descubra o que está movimentando cada ativo e aprenda a ler o contexto sem pressa.</p><div className="welcome-meta"><span>Dados ao vivo</span><span>8 ativos acompanhados</span></div></div><div className="market-brief"><div className="market-brief-heading"><span>RADAR DE HOJE</span><small>24H</small></div>{bestCoin && <div className="brief-row"><span><b className="brief-dot positive-dot" />Maior alta</span><strong>{bestCoin.symbol.toUpperCase()} <em className="positive">{formatPercent(bestCoin.price_change_percentage_24h)}</em></strong></div>}{worstCoin && <div className="brief-row"><span><b className="brief-dot negative-dot" />Maior queda</span><strong>{worstCoin.symbol.toUpperCase()} <em className="negative">{formatPercent(worstCoin.price_change_percentage_24h)}</em></strong></div>}{topCoin && <div className="brief-row"><span><b className="brief-dot purple-dot" />Líder por valor</span><strong>{topCoin.symbol.toUpperCase()} <em>#{topCoin.market_cap_rank}</em></strong></div>}<div className="brief-focus"><span>SEU FOCO ATUAL</span><strong>{user.preferences.focus}</strong><small>Ajuste essa preferência no seu perfil.</small></div></div></section>
    <section className="market-section"><div className="dashboard-section-heading"><div><p className="dashboard-kicker">MERCADO CRIPTO</p><h2>O que está se movendo.</h2></div><span className="content-note">Dados ao vivo · não é recomendação</span></div>{error && <p className="api-error">{error}</p>}{loadingMarket ? <p className="market-status">Carregando dados do mercado...</p> : <div className="market-grid">{coins.map((coin) => <button className={`market-card ${selectedCoin?.id === coin.id ? 'selected' : ''}`} key={coin.id} onClick={() => selectCoin(coin)}><span className="coin-symbol">{coin.symbol.slice(0, 4)}</span><span className="coin-name">{coin.name}</span><strong>{formatPrice(coin.current_price)}</strong><small className={coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>{formatPercent(coin.price_change_percentage_24h)} hoje</small><em>#{coin.market_cap_rank} · cap. {formatMarketCap(coin.market_cap)}</em></button>)}</div>}</section>
    <section className="related-news-section"><div className="dashboard-section-heading"><div><p className="dashboard-kicker">CONTEXTO</p><h2>{selectedCoin ? `Notícias sobre ${selectedCoin.name}.` : 'Escolha uma cripto.'}</h2></div><span className="content-note">Manchetes + link original</span></div>{!selectedCoin && <p className="market-status">Selecione um ativo acima para buscar manchetes relacionadas.</p>}{loadingNews && <p className="market-status">Buscando manchetes relacionadas...</p>}{!loadingNews && selectedCoin && headlines.length === 0 && <p className="market-status">Nenhuma manchete encontrada para este ativo.</p>}{!loadingNews && headlines.length > 0 && <div className="headline-list">{headlines.map((headline) => <a className="headline-item" href={headline.url} target="_blank" rel="noreferrer" key={headline.id}><div><span>{headline.source} · {formatDate(headline.publishedAt)}</span><h3>{headline.title}</h3></div><b>↗</b></a>)}</div>}<p className="rights-note">Manchetes e links pertencem às fontes originais. O Abracadabra exibe apenas metadados e não reproduz o conteúdo das matérias. Dados via <a href="https://cryptocurrency.cv/" target="_blank" rel="noreferrer">Crypto Vision News</a>.</p></section>
  </>
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 1 ? 4 : 2 }).format(value)
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

function ProfilePanel({ user, onSave, onLogout }: DashboardPageProps & { onSave: (changes: Partial<UserProfile>) => void }) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio)
  const [focus, setFocus] = useState(user.preferences.focus)
  const [weeklyDigest, setWeeklyDigest] = useState(user.preferences.weeklyDigest)
  const [saved, setSaved] = useState(false)

  function saveChanges() {
    onSave({ displayName: displayName.trim() || user.displayName, bio: bio.trim(), preferences: { focus, weeklyDigest } })
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

  return <section className="panel-page profile-page"><p className="dashboard-kicker">SEU ESPAÇO</p><h1>Perfil</h1><p className="panel-lead">Personalize como você aparece dentro do Abracadabra. Por enquanto, essas informações ficam salvas neste navegador.</p><div className="profile-editor"><div className="profile-editor-top"><label className="profile-avatar large-avatar" htmlFor="avatar-upload">{user.avatarUrl ? <img src={user.avatarUrl} alt="Sua foto" /> : user.displayName.slice(0, 1)}<span>Trocar foto</span></label><input id="avatar-upload" className="visually-hidden" type="file" accept="image/*" onChange={uploadAvatar} /><div><h2>{user.displayName}</h2><p>@{user.username}</p></div></div><div className="profile-fields"><label>Nome de exibição<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Bio<textarea value={bio} rows={3} onChange={(event) => setBio(event.target.value)} /></label><label>Meu foco<select value={focus} onChange={(event) => setFocus(event.target.value)}><option>Fundamentos de Web3</option><option>Solana e ecossistema</option><option>Construção de projetos</option><option>Cripto e mercado</option></select></label><label className="preference-toggle"><input type="checkbox" checked={weeklyDigest} onChange={(event) => setWeeklyDigest(event.target.checked)} /><span><strong>Resumo semanal</strong><small>Receber uma seleção dos principais conteúdos para continuar descobrindo.</small></span></label></div><div className="profile-editor-actions"><button className="save-profile" onClick={saveChanges}>Salvar alterações</button>{saved && <span className="saved-message">Perfil salvo neste navegador.</span>}</div></div><button className="logout-button" onClick={onLogout}>Sair da conta</button></section>
}

function ActivitiesPanel({ user, onSave }: { user: UserProfile; onSave: (changes: Partial<UserProfile>) => void }) {
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
    onSave({ xp: nextProgress.xp, completedActivities: nextProgress.completed, level: getLevelFromXp(nextProgress.xp).label })
  }

  function nextQuestion() {
    setQuestion(createQuestion(difficulty))
    setSelectedAnswer(null)
    setFeedback(false)
  }

  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0
  const xpToNext = Math.max(level.next - progress.xp, 0)

  return <section className="activities-page"><div className="activities-heading"><div><p className="dashboard-kicker">LABORATÓRIO DE PRÁTICA</p><h1>Aprenda fazendo.</h1><p className="panel-lead">Perguntas diferentes a cada rodada, com dificuldade progressiva e XP para acompanhar sua evolução.</p></div><div className="xp-card"><span>XP TOTAL</span><strong>{progress.xp}</strong><small>{xpToNext ? `${xpToNext} XP até o próximo nível` : 'Nível máximo da demo'}</small></div></div><div className="activity-stats"><div><span>NÍVEL ATUAL</span><strong>{level.label}</strong></div><div><span>RESPONDIDAS</span><strong>{progress.answered}</strong></div><div><span>APROVEITAMENTO</span><strong>{accuracy}%</strong></div><div><span>SEQUÊNCIA</span><strong>{user.streak} dia</strong></div></div><div className="difficulty-tabs"><span>DIFICULDADE</span>{(['iniciante', 'intermediario', 'avancado'] as ActivityDifficulty[]).map((option) => <button key={option} className={difficulty === option ? 'active' : ''} onClick={() => changeDifficulty(option)}>{option === 'intermediario' ? 'Intermediário' : option === 'avancado' ? 'Avançado' : 'Iniciante'}</button>)}</div><article className="question-card"><div className="question-meta"><span>{question.category}</span><span>+{question.xp} XP</span></div><p className="question-count">QUESTÃO GERADA · {question.difficulty}</p><h2>{question.prompt}</h2><div className="answer-grid">{question.options.map((option, index) => <button key={option} className={selectedAnswer === null ? '' : index === question.answerIndex ? 'correct' : index === selectedAnswer ? 'incorrect' : 'muted'} onClick={() => answer(index)}>{option}</button>)}</div>{feedback && <div className={`answer-feedback ${selectedAnswer === question.answerIndex ? 'success' : 'failure'}`}><strong>{selectedAnswer === question.answerIndex ? `+${question.xp} XP · Mandou bem.` : 'Ainda não.'}</strong><span>{question.explanation}</span><button onClick={nextQuestion}>Próxima questão →</button></div>}</article><p className="activity-footnote">As questões são geradas a partir de combinações de conceitos, cenários e níveis. Cada rodada recebe um identificador novo e não repete a questão na mesma sequência local.</p></section>
}
