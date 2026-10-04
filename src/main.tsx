import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

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
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')

  function continueWithEmail() {
    if (!email.trim()) {
      setNotice('Digite seu e-mail para continuar.')
      return
    }
    setNotice('Perfeito. Vamos preparar sua jornada.')
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
        <div className="auth-card"><div className="auth-topline"><span>ÁREA DO ALUNO</span><span className="topline-line" /></div><div className="auth-heading"><div className="icon-orb"><Icon name="spark" size={18} /></div><p className="auth-kicker">Sua aventura começa aqui</p><h2>Entre para<br /><span>desbloquear.</span></h2><p className="auth-subtitle">Continue sua jornada, acompanhe seu progresso e desbloqueie novas atividades.</p></div><div className="auth-actions"><button className="primary-button" onClick={() => setNotice('O login com Google entra na próxima etapa.')}>Continuar com Google <Icon name="arrow" size={17} /></button><div className="divider"><span>ou entre com e-mail</span></div><label className="input-label" htmlFor="email">E-mail</label><div className="input-wrap"><Icon name="mail" size={17} /><input id="email" type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => { setEmail(event.target.value); setNotice('') }} onKeyDown={(event) => event.key === 'Enter' && continueWithEmail()} /><button aria-label="Continuar com e-mail" onClick={continueWithEmail}><Icon name="arrow" size={17} /></button></div><button className="wallet-button" onClick={() => setNotice('A conexão de wallet estará disponível em breve.')}><Icon name="wallet" size={17} /> Conectar wallet <span>em breve</span></button>{notice && <p className="notice" role="status"><Icon name="check" size={14} /> {notice}</p>}</div><p className="terms">Ao continuar, você concorda com nossos <a href="#termos">Termos de uso</a> e <a href="#privacidade">Política de privacidade</a>.</p><div className="security-note"><Icon name="lock" size={14} /><span>Sem seed phrase. Nunca pediremos sua chave privada.</span></div></div><p className="auth-footer">Ainda não sabe por onde começar? <button onClick={() => navigate('/')}>Voltar para explicação <Icon name="arrow" size={13} /></button></p>
      </section>
    </main>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update) }, [])
  return path === '/login' ? <LoginPage /> : <HomePage />
}

createRoot(document.getElementById('root')!).render(<App />)
