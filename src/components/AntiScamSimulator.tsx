import { useState } from 'react'
import { SECURITY_SCENARIOS } from '../lib/missionsEngine'
import { isSpeechSupported, speakText, stopSpeaking } from '../lib/audioVoice'

interface AntiScamSimulatorProps {
  onComplete: () => void
}

export function AntiScamSimulator({ onComplete }: AntiScamSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userChoice, setUserChoice] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const scenario = SECURITY_SCENARIOS[currentIndex]

  function handleChoice(isScam: boolean) {
    if (userChoice !== null) return
    setUserChoice(isScam)
    if (isScam === scenario.isScam) {
      setScore((s) => s + 1)
    }
  }

  function handleNext() {
    stopSpeaking()
    setIsSpeaking(false)
    setUserChoice(null)
    if (currentIndex + 1 < SECURITY_SCENARIOS.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setFinished(true)
      onComplete()
    }
  }

  function handleRestart() {
    stopSpeaking()
    setIsSpeaking(false)
    setCurrentIndex(0)
    setUserChoice(null)
    setScore(0)
    setFinished(false)
  }

  function toggleSpeech(text: string) {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    } else {
      speakText(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    }
  }

  if (finished) {
    return (
      <div className="antiscam-finished-card">
        <div className="antiscam-trophy">🛡️</div>
        <h2>Treinamento Anti-Golpe Concluído!</h2>
        <p className="antiscam-score">
          Você acertou <strong>{score} de {SECURITY_SCENARIOS.length}</strong> cenários.
        </p>
        <div className="antiscam-summary-box">
          <h4>As 3 Regras de Ouro para sua Segurança:</h4>
          <ul>
            <li>🔑 <strong>Chave Pública (Endereço):</strong> Pode passar para qualquer pessoa para receber moedas (é o seu Pix Cripto).</li>
            <li>🔐 <strong>Chave Privada (12 Palavras / Seed Phrase):</strong> NUNCA passe para ninguém, nem para suporte, amigo ou gerente!</li>
            <li>🚫 <strong>Promessas de lucro fácil:</strong> Quem promete dobrar seu dinheiro da noite pro dia é 100% golpista.</li>
          </ul>
        </div>
        <button type="button" className="btn-restart-antiscam" onClick={handleRestart}>
          Refazer Treinamento ↺
        </button>
      </div>
    )
  }

  const isAnswered = userChoice !== null
  const isCorrect = isAnswered && userChoice === scenario.isScam

  return (
    <article className="antiscam-card">
      <div className="antiscam-top">
        <div className="antiscam-label-row">
          <span className="badge-shield">🛡️ SIMULADOR ANTI-GOLPE</span>
          <span className="antiscam-step">Cenário {currentIndex + 1} de {SECURITY_SCENARIOS.length}</span>
        </div>
        <h3>{scenario.title}</h3>
      </div>

      <div className="scenario-bubble-box">
        <div className="scenario-sender">
          <span className="sender-avatar">👤</span>
          <span className="sender-name">{scenario.sender}</span>
        </div>
        <blockquote className="scenario-message">
          {scenario.message}
        </blockquote>
      </div>

      <p className="antiscam-prompt">
        Esse contato ou proposta é seguro ou é uma cilada?
      </p>

      <div className="antiscam-choice-buttons">
        <button
          type="button"
          className={`btn-choice scam ${isAnswered ? (scenario.isScam ? 'correct-highlight' : 'dimmed') : ''}`}
          onClick={() => handleChoice(true)}
          disabled={isAnswered}
        >
          <span className="choice-icon">🚨</span>
          <div>
            <strong>É CILADA!</strong>
            <small>Tentativa de golpe ou fraude</small>
          </div>
        </button>

        <button
          type="button"
          className={`btn-choice safe ${isAnswered ? (!scenario.isScam ? 'correct-highlight' : 'dimmed') : ''}`}
          onClick={() => handleChoice(false)}
          disabled={isAnswered}
        >
          <span className="choice-icon">✅</span>
          <div>
            <strong>É SEGURO!</strong>
            <small>Operação normal e sem risco</small>
          </div>
        </button>
      </div>

      {isAnswered && (
        <div className={`antiscam-feedback ${isCorrect ? 'success' : 'warning'}`}>
          <div className="feedback-head">
            <strong>{isCorrect ? '🎉 Mandou bem! Você identificou corretamente.' : '⚠️ Atenção máxima com esse tipo de situação!'}</strong>
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn-listen-advice"
                onClick={() => toggleSpeech(`${scenario.explanation} Recomendação prática: ${scenario.actionAdvice}`)}
              >
                {isSpeaking ? '⏹️ Parar' : '🔊 Ouvir Explicação'}
              </button>
            )}
          </div>
          <p className="feedback-explanation">{scenario.explanation}</p>
          <div className="feedback-advice">
            <span>💡 O que fazer:</span> {scenario.actionAdvice}
          </div>
          <button type="button" className="btn-next-scenario" onClick={handleNext}>
            {currentIndex + 1 < SECURITY_SCENARIOS.length ? 'Próximo Cenário →' : 'Concluir Desafio 🏆'}
          </button>
        </div>
      )}
    </article>
  )
}
