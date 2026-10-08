import { useState } from 'react'
import { isSpeechSupported, speakText, stopSpeaking } from '../lib/audioVoice'

interface DiagnosticsLabProps {
  onComplete: () => void
  onRewardXp: (amount: number) => void
}

interface DiagnosticScenario {
  id: string
  errorTitle: string
  errorCode: string
  errorMessage: string
  context: string
  options: string[]
  correctIndex: number
  explanation: string
  lesson: string
}

const DIAGNOSTIC_SCENARIOS: DiagnosticScenario[] = [
  {
    id: 'err_insufficient_fee',
    errorTitle: 'Erro 01: Saldo Insuficiente para Taxa de Rede',
    errorCode: 'Program failed: Insufficient funds for fee or rent (0x1)',
    errorMessage: 'Transaction simulation failed: Attempt to debit an account but balance would fall below rent-exempt threshold.',
    context:
      'Você possui exatamente 1.000000 SOL na carteira e tentou enviar exatamente 1.000000 SOL para um colega. A carteira acusou erro vermelho e a transação não foi enviada.',
    options: [
      'A rede blockchain quebrou e seu saldo desapareceu para sempre.',
      'Toda transação exige uma taxa de rede (gas fee) para os validadores; é necessário deixar uma fração mínima de SOL para pagá-la.',
      'Você precisa contratar uma assinatura mensal para poder transferir valores redondos.',
    ],
    correctIndex: 1,
    explanation:
      'Correto! Na blockchain, nenhuma operação é de graça: os validadores que processam e gravam os blocos recebem uma taxa microscópica (ex: 0.000005 SOL). Se você tentar enviar 100% do que tem, não sobra nada para pagar a taxa!',
    lesson: 'Sempre deixe uma pequena sobra (ex: 0.01 SOL) na carteira para cobrir as taxas das próximas transações.',
  },
  {
    id: 'err_wrong_network',
    errorTitle: 'Erro 02: Endereço de Rede Incompatível (EVM vs Solana)',
    errorCode: 'Invalid address format: Expected Base58 address, received 0x71C...49A',
    errorMessage: 'Destination address is not a valid Solana public key.',
    context:
      'Um amigo pediu para você enviar SOL, mas colou uma chave que começa com "0x" (formato das redes Ethereum, Polygon e BSC).',
    options: [
      'O endereço é de outra blockchain (EVM). Enviar diretamente sem uma ponte (Bridge) causará erro ou perda permanente dos fundos.',
      'O endereço está correto, basta a Solana esperar 24 horas para converter automaticamente.',
      'É apenas um erro de digitação do nome do banco digital do seu amigo.',
    ],
    correctIndex: 0,
    explanation:
      'Excelente diagnóstico! Redes diferentes falam idiomas criptográficos diferentes. Solana usa codificação Base58 (sem 0x), enquanto Ethereum usa hexadecimal (começa com 0x). Você nunca deve enviar moedas de uma rede para outra sem uma "Ponte" (Bridge) autorizada.',
    lesson: 'Confira sempre se a rede de origem e a rede de destino são idênticas antes de confirmar.',
  },
  {
    id: 'err_slippage',
    errorTitle: 'Erro 03: Slippage Excedido em Corretora Descentralizada (DEX)',
    errorCode: 'Swap error: Slippage tolerance exceeded (0.10%)',
    errorMessage: 'Output amount received would be less than minimum requested.',
    context:
      'Ao tentar trocar SOL por um novo token na DEX com tolerância de slippage configurada em 0.1%, a transação foi revertida.',
    options: [
      'A corretora descentralizada sumiu com as moedas.',
      'O preço variou no pool de liquidez enquanto a transação aguardava validação; o slippage configurado era rígido demais.',
      'Seu computador pegou um vírus e corrompeu a transação.',
    ],
    correctIndex: 1,
    explanation:
      'Muito bem! Slippage é a margem de tolerância para oscilação de preço entre o instante em que você clica e o instante em que o bloco é gravado. Se o preço oscilar mais do que sua tolerância, o contrato reverte a transação para proteger você de pagar mais caro.',
    lesson: 'Em momentos de alta volatilidade, ajuste ligeiramente a margem de slippage (ex: 0.5% a 1.0%) ou aguarde o mercado acalmar.',
  },
  {
    id: 'err_dusting_attack',
    errorTitle: 'Erro 04: Token Suspeito Misterioso no Extrato (Dusting Attack)',
    errorCode: 'Unsolicited Token Received: CLAIM-500-USDC-NOW.COM',
    errorMessage: 'Balance: 10,000 CLAIM-TOKENS (Value: Unknown)',
    context:
      'Apareceu de repente no seu extrato um token desconhecido com nome de site prometendo dinheiro fácil se você visitar o link.',
    options: [
      'Foi um presente de uma empresa e você deve entrar no link para reivindicar os dólares.',
      'É uma tentativa de golpe de phishing ("Dusting Attack"). O site pedirá permissão na sua carteira para drenar todos os seus fundos.',
      'É uma taxa obrigatória cobrada pelo governo.',
    ],
    correctIndex: 1,
    explanation:
      'Perfeito! Golpistas enviam tokens sem valor com nomes de sites maliciosos para milhares de carteiras públicas. Se você entrar no site e clicar em "Conectar Carteira / Assinar Contrato", o contrato malicioso ganha permissão para esvaziar suas moedas.',
    lesson: 'Nunca acesse sites indicados em tokens que você não comprou. Apenas ignore ou oculte da visualização.',
  },
  {
    id: 'err_pending_tx',
    errorTitle: 'Erro 05: Transação Pendente ou Presa na Memória da Rede',
    errorCode: 'Transaction Pending / Status unconfirmed after 180s',
    errorMessage: 'Waiting for network validators confirmation threshold.',
    context:
      'Você enviou uma transação para pagar um serviço e o status continua "Pendente" há alguns minutos. O que você faz primeiro para investigar com calma?',
    options: [
      'Clica no botão de enviar mais 5 vezes seguidas na esperança de dar certo.',
      'Copia a Assinatura (Hash da transação) e consulta o status em um Explorador de Blocos oficial (como o Solscan).',
      'Desinstala o navegador e formata o celular.',
    ],
    correctIndex: 1,
    explanation:
      'Exato! A blockchain é um livro-razão aberto. Com o Hash (assinatura da transação), você consulta no explorador público se a transação foi aceita, se ainda está na fila (mempool) ou se foi rejeitada. Isso evita que você mande o pagamento em dobro por engano.',
    lesson: 'O explorador de blocos é o seu melhor amigo para verificar o status real de qualquer operação on-chain.',
  },
]

export function DiagnosticsLab({ onComplete, onRewardXp }: DiagnosticsLabProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const scenario = DIAGNOSTIC_SCENARIOS[currentIndex]
  const isAnswered = selectedOption !== null
  const isCorrect = isAnswered && selectedOption === scenario.correctIndex

  function handleSelect(optionIdx: number) {
    if (isAnswered) return
    setSelectedOption(optionIdx)
    if (optionIdx === scenario.correctIndex) {
      setScore((s) => s + 1)
      onRewardXp(25)
    }
  }

  function handleNext() {
    stopSpeaking()
    setIsSpeaking(false)
    setSelectedOption(null)
    if (currentIndex + 1 < DIAGNOSTIC_SCENARIOS.length) {
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
    setSelectedOption(null)
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
      <div className="diag-finished-card">
        <div className="diag-trophy">🩺 🎓 🏆</div>
        <h3>Laboratório de Diagnóstico Concluído!</h3>
        <p className="diag-score">
          Você resolveu com sucesso <strong>{score} de {DIAGNOSTIC_SCENARIOS.length}</strong> casos de erro on-chain.
        </p>
        <div className="diag-summary-box">
          <h4>Resumo do Médico da Blockchain:</h4>
          <ul>
            <li>⛽ <strong>Taxa de Rede (Gas):</strong> Nunca envie 100% do saldo; deixe uma folga para os nós da rede.</li>
            <li>🌐 <strong>Endereço Certo:</strong> Não envie SOL para endereços que começam com "0x" (EVM).</li>
            <li>🔄 <strong>Slippage:</strong> É proteção contra oscilação rápida de preço no pool de liquidez.</li>
            <li>🕵️‍♂️ <strong>Tokens Estranhos:</strong> Nunca visite links de airdrops não solicitados.</li>
            <li>🔍 <strong>Explorador de Blocos:</strong> O Solscan é a fonte da verdade para transações pendentes.</li>
          </ul>
        </div>
        <button type="button" className="btn-restart-diag" onClick={handleRestart}>
          Refazer Laboratório ↺
        </button>
      </div>
    )
  }

  return (
    <article className="diag-card">
      <div className="diag-top">
        <div className="diag-label-row">
          <span className="badge-diag">🩺 LABORATÓRIO DE ERROS ON-CHAIN</span>
          <span className="diag-step">Caso {currentIndex + 1} de {DIAGNOSTIC_SCENARIOS.length}</span>
        </div>
        <h3>{scenario.errorTitle}</h3>
      </div>

      <div className="diag-console-box">
        <div className="console-header">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
          <span className="console-title">Registro de Erro na Carteira (Simulação)</span>
        </div>
        <div className="console-body">
          <code className="error-code-line">ERR: {scenario.errorCode}</code>
          <p className="error-msg-line">"{scenario.errorMessage}"</p>
        </div>
      </div>

      <div className="diag-context-card">
        <div className="context-title-row">
          <strong>Contexto da Situação:</strong>
          {isSpeechSupported() && (
            <button
              type="button"
              className="btn-audio-mini"
              onClick={() => toggleSpeech(`${scenario.context} Qual é o diagnóstico correto?`)}
              title="Ouvir caso em áudio"
            >
              {isSpeaking ? '⏹ Parar' : '🔊 Ouvir'}
            </button>
          )}
        </div>
        <p>{scenario.context}</p>
      </div>

      <div className="diag-prompt">
        <span>Pergunta do Tutor:</span>
        <h4>O que aconteceu nesta situação e qual é o diagnóstico correto?</h4>
      </div>

      <div className="diag-options-list">
        {scenario.options.map((opt, idx) => {
          let btnClass = 'diag-option-btn'
          if (isAnswered) {
            if (idx === scenario.correctIndex) btnClass += ' correct'
            else if (idx === selectedOption) btnClass += ' wrong'
            else btnClass += ' disabled'
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              className={btnClass}
              onClick={() => handleSelect(idx)}
            >
              <span className="option-letter">{['A', 'B', 'C'][idx]}</span>
              <span className="option-text">{opt}</span>
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div className={`diag-feedback-panel ${isCorrect ? 'positive' : 'negative'}`}>
          <div className="feedback-header">
            <span className="feedback-icon">{isCorrect ? '🎉 Diagnóstico Perfeito!' : '⚠️ Atenção ao Diagnóstico:'}</span>
            {isCorrect && <span className="xp-badge">+25 XP</span>}
          </div>
          <p className="feedback-explanation">{scenario.explanation}</p>
          <div className="feedback-lesson-card">
            <strong>💡 Lição Prática:</strong> {scenario.lesson}
          </div>
          <button type="button" className="btn-next-diag" onClick={handleNext}>
            {currentIndex + 1 < DIAGNOSTIC_SCENARIOS.length ? 'Próximo Caso de Erro ➔' : 'Concluir Laboratório 🎉'}
          </button>
        </div>
      )}
    </article>
  )
}
