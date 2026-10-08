import { useState, useMemo } from 'react'
import { isSpeechSupported, speakText, stopSpeaking } from '../lib/audioVoice'

interface SeedPhraseGameProps {
  onComplete: () => void
  onRewardXp: (amount: number) => void
}

const DEFAULT_SEED_WORDS = [
  'farol',
  'galaxia',
  'oceano',
  'validador',
  'chave',
  'cadeado',
  'portal',
  'horizonte',
  'energia',
  'diamante',
  'estrela',
  'futuro',
]

export function SeedPhraseGame({ onComplete, onRewardXp }: SeedPhraseGameProps) {
  const [step, setStep] = useState<'reveal' | 'quiz' | 'success'>('reveal')
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copied, setCopied] = useState(false)

  // Embaralha as palavras para o quiz de ordenação
  const shuffledWords = useMemo(() => {
    return [...DEFAULT_SEED_WORDS].sort(() => 0.5 - Math.random())
  }, [step])

  function handleSelectWord(word: string) {
    if (selectedWords.includes(word)) return
    if (selectedWords.length >= 12) return
    setValidationError(null)
    setSelectedWords((prev) => [...prev, word])
  }

  function handleRemoveWord(index: number) {
    setValidationError(null)
    setSelectedWords((prev) => prev.filter((_, i) => i !== index))
  }

  function handleClear() {
    setSelectedWords([])
    setValidationError(null)
  }

  function handleCopy() {
    navigator.clipboard.writeText(DEFAULT_SEED_WORDS.join(' '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleVerify() {
    if (selectedWords.length < 12) {
      setValidationError('Por favor, selecione todas as 12 palavras antes de validar.')
      return
    }

    const isCorrect = selectedWords.every((word, idx) => word === DEFAULT_SEED_WORDS[idx])
    if (isCorrect) {
      setValidationError(null)
      setStep('success')
      onRewardXp(50)
      onComplete()
    } else {
      setValidationError('A ordem das palavras não confere com o backup original. Remova as que errou e tente de novo com calma!')
    }
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

  const voiceExplanation =
    'Esta é a sua Frase Semente, composta por doze palavras. Ela é a chave mestra matemática da sua carteira. Quem tem essas palavras tem o controle total dos seus fundos. Anote sempre em um papel físico e nunca compartilhe com ninguém.'

  return (
    <article className="seed-phrase-card">
      <div className="seed-card-header">
        <div className="seed-badge-row">
          <span className="badge-seed">🔐 COFRE DAS 12 PALAVRAS</span>
          <span className="seed-step-indicator">
            {step === 'reveal' ? 'Etapa 1: Anotar Backup' : step === 'quiz' ? 'Etapa 2: Teste de Restauração' : 'Concluído 🎉'}
          </span>
        </div>
        <h3>{step === 'reveal' ? 'Sua Frase Secreta de Segurança (Seed Phrase)' : step === 'quiz' ? 'Reconstitua sua Carteira na Ordem Certa' : 'Parabéns, Carteira Protegida!'}</h3>
      </div>

      {step === 'reveal' && (
        <div className="seed-reveal-view">
          <p className="seed-intro-desc">
            Em Web3, <strong>não existe botão de "esqueci minha senha"</strong> em um servidor central. A sua chave privada é gerada a partir destas <strong>12 palavras secretas</strong>.
          </p>

          <div className="seed-warning-box">
            <span className="seed-warning-icon">⚠️</span>
            <div>
              <strong>Regra de Ouro da Autocustódia:</strong>
              <p>Anote em papel ou guarde em local seguro fora da internet. Nunca tire print nem envie por WhatsApp ou e-mail.</p>
            </div>
          </div>

          <div className="seed-words-grid">
            {DEFAULT_SEED_WORDS.map((word, idx) => (
              <div key={word} className="seed-word-item">
                <span className="word-index">{idx + 1}</span>
                <span className="word-value">{word}</span>
              </div>
            ))}
          </div>

          <div className="seed-actions-row">
            <button
              type="button"
              className="btn-seed-aux"
              onClick={handleCopy}
              title="Copiar palavras para colar temporariamente em suas anotações"
            >
              {copied ? '✓ Copiado!' : '📋 Copiar Palavras'}
            </button>

            {isSpeechSupported() && (
              <button
                type="button"
                className={`btn-seed-aux ${isSpeaking ? 'active-speaking' : ''}`}
                onClick={() => toggleSpeech(voiceExplanation)}
                title="Ouvir explicação em áudio"
              >
                {isSpeaking ? '⏹ Parar Áudio' : '🔊 Ouvir Explicação'}
              </button>
            )}

            <button
              type="button"
              className="btn-seed-primary"
              onClick={() => {
                stopSpeaking()
                setIsSpeaking(false)
                setStep('quiz')
              }}
            >
              Já anotei tudo, testar meu backup ➔
            </button>
          </div>
        </div>
      )}

      {step === 'quiz' && (
        <div className="seed-quiz-view">
          <p className="seed-quiz-instructions">
            Clique nas palavras embaralhadas abaixo na ordem exata de <strong>1 a 12</strong> para simular a restauração da sua carteira.
          </p>

          <div className="seed-slots-container">
            {Array.from({ length: 12 }).map((_, idx) => {
              const currentWord = selectedWords[idx]
              const isFilled = Boolean(currentWord)
              const isSlotWrong = isFilled && currentWord !== DEFAULT_SEED_WORDS[idx] && validationError !== null

              return (
                <div
                  key={idx}
                  className={`seed-slot ${isFilled ? 'filled' : 'empty'} ${isSlotWrong ? 'wrong' : ''}`}
                  onClick={() => isFilled && handleRemoveWord(idx)}
                  title={isFilled ? 'Clique para remover esta palavra' : undefined}
                >
                  <span className="slot-number">{idx + 1}</span>
                  <span className="slot-word">{currentWord || '—'}</span>
                  {isFilled && <span className="slot-remove">✕</span>}
                </div>
              )
            })}
          </div>

          {validationError && (
            <div className="seed-error-alert" role="alert">
              ⚠️ {validationError}
            </div>
          )}

          <div className="seed-shuffled-pool">
            <span className="pool-label">Palavras disponíveis para seleção:</span>
            <div className="pool-chips">
              {shuffledWords.map((word) => {
                const isUsed = selectedWords.includes(word)
                return (
                  <button
                    key={word}
                    type="button"
                    disabled={isUsed}
                    className={`pool-chip ${isUsed ? 'used' : ''}`}
                    onClick={() => handleSelectWord(word)}
                  >
                    {word}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="seed-quiz-footer">
            <button type="button" className="btn-seed-aux" onClick={handleClear}>
              Limpar Seleção ↺
            </button>
            <button
              type="button"
              className="btn-seed-aux"
              onClick={() => {
                setSelectedWords([])
                setValidationError(null)
                setStep('reveal')
              }}
            >
              Voltar e Rever Palavras ↺
            </button>
            <button
              type="button"
              className="btn-seed-primary"
              disabled={selectedWords.length !== 12}
              onClick={handleVerify}
            >
              Validar e Restaurar Carteira 🔐
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="seed-success-view">
          <div className="seed-success-badge">🎉 🔐 🏆</div>
          <h4>Excelente! Você domina o conceito de Seed Phrase!</h4>
          <p>
            Você restaurou com sucesso sua carteira simulada na ordem exata. Você ganhou <strong>+50 XP</strong> e o emblema <strong>Guardião da Frase Secreta</strong>!
          </p>
          <div className="seed-takeaways-card">
            <h5>Lembre-se sempre:</h5>
            <ul>
              <li>✅ Seus fundos moram na blockchain, não no aparelho. A seed phrase é o seu passaporte para eles.</li>
              <li>❌ NUNCA compartilhe suas 12 palavras com nenhum site, suporte ou pessoa.</li>
            </ul>
          </div>
          <button
            type="button"
            className="btn-seed-primary"
            onClick={() => {
              setSelectedWords([])
              setStep('reveal')
            }}
          >
            Refazer Desafio ↺
          </button>
        </div>
      )}
    </article>
  )
}
