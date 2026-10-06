import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { DashboardPage } from './pages/DashboardPage'
import { getCurrentUser, signInDemo } from './lib/demoAuth'
import { requestOfficialGoogleLogin } from './lib/googleAuth'

type IconName = 'spark' | 'arrow' | 'mail' | 'wallet' | 'lock' | 'check' | 'book' | 'flask' | 'bolt' | 'path'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'spark') return <svg {...common}><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L19 16Z" /></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
  if (name === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
  if (name === 'wallet') return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M4 8h15" /><path d="M17 13h4" /><circle cx="17" cy="13" r=".7" fill="currentColor" stroke="none" /></svg>
  if (name === 'lock') return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
  if (name === 'book') return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 5.5V21" /><path d="M8 7h8" /><path d="M8 11h6" /></svg>
  if (name === 'flask') return <svg {...common}><path d="M9 3h6" /><path d="M10 3v6l-5.2 8.4A2.4 2.4 0 0 0 6.8 21h10.4a2.4 2.4 0 0 0 2-3.6L14 9V3" /><path d="M8 15h8" /></svg>
  if (name === 'bolt') return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></svg>
  if (name === 'path') return <svg {...common}><circle cx="5" cy="18" r="2" /><circle cx="19" cy="6" r="2" /><path d="m7 17 10-9" /></svg>
  return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function SiteLogo() {
  return <img src="/logo-abracadabra.svg" alt="Abracadabra" className="site-logo" />
}

function HomePage() {
  return (
    <main className="home-page">
      <div className="home-glow home-glow-one" />
      <div className="home-glow home-glow-two" />
      <header className="site-nav">
        <a href="/" className="home-logo-link"><SiteLogo /></a>
        <nav className="home-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
        </nav>
        <button className="nav-login" onClick={() => navigate('/login')}>Área do aluno <Icon name="arrow" size={15} /></button>
      </header>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker"><span className="kicker-line" /> Web3 sem complicação</p>
          <h1>Entenda. <em>Pratique.</em><br />Crie o seu caminho.</h1>
          <p className="home-lead">Uma jornada guiada para sair do “o que é uma wallet?” e chegar ao primeiro passo on-chain — no seu ritmo, com uma experiência que faz sentido.</p>
          <div className="home-actions">
            <a href="#como-funciona" className="home-secondary">Como funciona <Icon name="arrow" size={16} /></a>
            <button className="home-primary" onClick={() => navigate('/login')}>Entrar na área do aluno <Icon name="arrow" size={16} /></button>
          </div>
        </div>
        <div className="home-visual" aria-hidden="true">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-spark spark-one"><Icon name="spark" size={18} /></div>
          <div className="visual-spark spark-two"><Icon name="spark" size={12} /></div>
          <div className="visual-core"><Icon name="spark" size={37} /></div>
          <div className="visual-word">WEB3</div>
          <div className="visual-caption"><strong>Mais clareza.</strong><span>Mais confiança para começar.</span></div>
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <div className="section-intro"><p className="section-label">Por que Abracadabra</p><h2>Web3 pode ser<br /><span>mais simples.</span></h2><p>Uma plataforma para quem quer entender o novo sem se sentir perdido no caminho.</p></div>
        <div className="learning-steps">
          <article className="learning-step"><span className="step-number">01</span><div className="step-icon"><Icon name="book" size={20} /></div><h3>Clareza</h3><p>Conceitos complexos explicados de um jeito que faz sentido.</p></article>
          <article className="learning-step"><span className="step-number">02</span><div className="step-icon"><Icon name="spark" size={20} /></div><h3>Ritmo</h3><p>Uma experiência que acompanha o seu momento e seu nível.</p></article>
          <article className="learning-step"><span className="step-number">03</span><div className="step-icon"><Icon name="path" size={20} /></div><h3>Progresso</h3><p>Uma forma visível e motivadora de perceber sua evolução.</p></article>
        </div>
      </section>

      <footer className="home-footer"><SiteLogo /><span>Aprender Web3 fazendo, um passo de cada vez.</span><button onClick={() => navigate('/login')}>Área do aluno <Icon name="arrow" size={14} /></button></footer>
    </main>
  )
}

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')

  function continueWithLogin() {
    if (!username.trim() || !password) {
      setNotice('Digite seu usuário e sua senha para continuar.')
      return
    }
    if (!signInDemo(username, password)) {
      setNotice('Usuário ou senha incorretos. Use teste123 e 123 para entrar.')
      return
    }
    navigate('/app')
  }

  function handleGoogleLoginClick() {
    requestOfficialGoogleLogin({
      onSuccess: () => {
        navigate('/app')
      },
      onError: () => {
        // Silencioso: ao fechar a tela do Google ou cancelar, não exibe erro nem abre popup!
      },
    })
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grain" />
      <section className="brand-panel">
        <header className="brand-header"><button className="back-home" onClick={() => navigate('/')}>← Voltar para home</button><img src="/logo-abracadabra.svg" alt="Abracadabra" className="brand-logo" /></header>
        <div className="brand-copy"><h1>Do primeiro clique ao mundo <em>on-chain.</em></h1><p className="intro">Uma jornada guiada para entender Web3, praticar de verdade e descobrir o que você é capaz de criar.</p></div>
        <div className="journey-line" aria-hidden="true"><span className="journey-node active"><Icon name="spark" size={14} /></span><span className="journey-stroke" /><span className="journey-node"><Icon name="wallet" size={14} /></span><span className="journey-stroke" /><span className="journey-node"><Icon name="check" size={14} /></span><div className="journey-caption"><strong>Seu caminho, no seu ritmo.</strong><span>Comece sem precisar saber nada.</span></div></div>
        <footer className="brand-footer"><span>Feito para quem quer entender o futuro.</span><span className="footer-dot">•</span><span>Na Solana Devnet</span></footer>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-topline"><span>ÁREA DO ALUNO</span><span className="topline-line" /></div>
          <div className="auth-heading">
            <div className="icon-orb"><Icon name="spark" size={18} /></div>
            <p className="auth-kicker">Sua aventura começa aqui</p>
            <h2>Entre para<br /><span>desbloquear.</span></h2>
            <p className="auth-subtitle">Continue sua jornada, acompanhe seu progresso e descubra o universo on-chain.</p>
          </div>

          <div className="auth-actions">
            {/* Botão Google / Gmail Oficial */}
            <button
              type="button"
              className="google-sign-in-btn"
              onClick={handleGoogleLoginClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
              </svg>
              <span>Continuar com Google</span>
            </button>

            <div className="divider">
              <span>OU ACESSO COM USUÁRIO</span>
            </div>

            <div className="demo-hint">Acesso de teste: <strong>teste123</strong> / <strong>123</strong></div>

            <label className="input-label" htmlFor="username">Usuário</label>
            <div className="input-wrap">
              <Icon name="mail" size={17} />
              <input id="username" type="text" placeholder="teste123" value={username} onChange={(event) => { setUsername(event.target.value); setNotice('') }} />
            </div>

            <label className="input-label password-label" htmlFor="password">Senha</label>
            <div className="input-wrap">
              <Icon name="lock" size={17} />
              <input id="password" type="password" placeholder="•••" value={password} onChange={(event) => { setPassword(event.target.value); setNotice('') }} onKeyDown={(event) => event.key === 'Enter' && continueWithLogin()} />
              <button aria-label="Entrar" onClick={continueWithLogin}><Icon name="arrow" size={17} /></button>
            </div>

            {notice && <p className="notice" role="status"><Icon name="check" size={14} /> {notice}</p>}
          </div>

          <p className="terms">Ao continuar, você concorda com nossos <a href="#termos">Termos de uso</a> e <a href="#privacidade">Política de privacidade</a>.</p>
          <div className="security-note"><Icon name="lock" size={14} /><span>Sem seed phrase. Nunca pediremos sua chave privada.</span></div>
        </div>
        <p className="auth-footer">Ainda não sabe por onde começar? <button onClick={() => navigate('/')}>Voltar para explicação <Icon name="arrow" size={13} /></button></p>
      </section>
    </main>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update) }, [])
  const user = getCurrentUser()
  if (path === '/app' && user) return <DashboardPage user={user} onLogout={() => navigate('/login')} />
  return path === '/login' ? <LoginPage /> : <HomePage />
}

createRoot(document.getElementById('root')!).render(<App />)
