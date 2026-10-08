import type { ActivityDifficulty, ActivityQuestion, UserPlan } from '../types'

const COUNTER_KEY = 'abracadabra.activity.counter'
const PROGRESS_KEY = 'abracadabra.activity.progress'

const concepts = [
  { term: 'wallet', answer: 'Uma ferramenta que permite acessar e assinar ações com seus ativos digitais.', wrong: ['Uma corretora que garante lucro', 'Um cartão físico para guardar moedas', 'Uma rede blockchain específica'] },
  { term: 'blockchain', answer: 'Um registro distribuído em que as transações são organizadas e verificadas por uma rede.', wrong: ['Um banco centralizado', 'Um tipo de carteira física', 'Uma senha para acessar uma conta'] },
  { term: 'seed phrase', answer: 'Uma sequência secreta que pode recuperar uma carteira e nunca deve ser compartilhada.', wrong: ['Um código público para receber tokens', 'O nome de usuário de uma wallet', 'Uma taxa cobrada pela rede'] },
  { term: 'smart contract', answer: 'Um programa publicado na blockchain que executa regras quando suas condições são atendidas.', wrong: ['Um contrato impresso e assinado', 'Um aplicativo de mensagens', 'Uma senha temporária'] },
  { term: 'gas', answer: 'O custo pago para que uma rede processe uma operação.', wrong: ['O preço fixo de qualquer token', 'Uma recompensa garantida', 'O saldo mínimo de uma wallet'] },
  { term: 'token', answer: 'Uma unidade digital que representa valor, utilidade, acesso ou outro direito em uma rede.', wrong: ['A senha privada de um usuário', 'O servidor que valida a rede', 'O nome de uma exchange'] },
]

const scenarios = [
  ['Você recebe uma mensagem pedindo sua seed phrase para liberar um airdrop. O que faz?', 'Ignora e não compartilha a frase; nenhum suporte legítimo precisa dela.', ['Envia somente algumas palavras', 'Publica a frase em um formulário', 'Conecta a wallet e assina tudo']],
  ['Uma transação aparece como pendente. Qual atitude é mais segura?', 'Verifica o status no explorador oficial antes de tentar repetir a operação.', ['Envia várias vezes até funcionar', 'Compartilha sua chave privada', 'Desinstala a wallet imediatamente']],
  ['Antes de assinar uma transação desconhecida, o melhor primeiro passo é:', 'Entender o que está sendo assinado e conferir o domínio e os dados da transação.', ['Assinar rápido para não perder a oportunidade', 'Desativar todas as notificações', 'Enviar seus dados pessoais']],
  ['Por que uma wallet de autocustódia exige cuidado?', 'Porque a responsabilidade pelo acesso e pela proteção das chaves fica com o usuário.', ['Porque ela sempre tem seguro contra perdas', 'Porque o saldo é garantido pela exchange', 'Porque a blockchain cancela erros automaticamente']],
  ['Qual é uma boa prática ao testar um projeto novo?', 'Usar uma wallet separada e começar com uma quantia pequena ou uma rede de testes.', ['Usar a seed phrase principal', 'Aprovar todas as permissões', 'Ignorar o domínio do projeto']],
  ['O que uma confirmação na blockchain indica?', 'Que a operação foi incluída e validada dentro das regras da rede.', ['Que o investimento terá lucro', 'Que não existe nenhuma taxa', 'Que a transação pode ser desfeita sempre']],
]

const difficultyData: Record<ActivityDifficulty, { label: string; xp: number }> = {
  iniciante: { label: 'Iniciante', xp: 10 },
  intermediario: { label: 'Intermediário', xp: 18 },
  avancado: { label: 'Avançado', xp: 28 },
}

const openers = ['Em uma revisão rápida:', 'Pensando na prática:', 'Em uma decisão on-chain:', 'Para construir uma base segura:']

function nextCounter() {
  const counter = Number(localStorage.getItem(COUNTER_KEY) || '0')
  localStorage.setItem(COUNTER_KEY, String(counter + 1))
  return counter
}

export function createQuestion(difficulty: ActivityDifficulty): ActivityQuestion {
  const counter = nextCounter()
  const mode = difficulty === 'iniciante' ? counter % 3 : difficulty === 'intermediario' ? (counter + 1) % 3 : 2
  const data = difficultyData[difficulty]
  if (mode === 0) {
    const concept = concepts[counter % concepts.length]
    const options = [concept.answer, ...concept.wrong].map((option, index) => ({ option, index })).sort((a, b) => ((a.index + counter) % 4) - ((b.index + counter) % 4))
    return { id: `${difficulty}-concept-${counter}`, difficulty, category: 'Conceitos', prompt: `${openers[counter % openers.length]} o que melhor descreve ${concept.term}?`, options: options.map((item) => item.option), answerIndex: options.findIndex((item) => item.index === 0), explanation: `A resposta correta conecta o conceito de ${concept.term} ao seu uso real no ecossistema Web3.`, xp: data.xp }
  }
  if (mode === 1) {
    const scenario = scenarios[counter % scenarios.length]
    const options = [scenario[1] as string, ...(scenario[2] as string[])]
    const ordered = options.map((option, index) => ({ option, index })).sort((a, b) => ((a.index + counter) % options.length) - ((b.index + counter) % options.length))
    return { id: `${difficulty}-scenario-${counter}`, difficulty, category: 'Segurança', prompt: `${openers[counter % openers.length]} ${scenario[0] as string}`, options: ordered.map((item) => item.option), answerIndex: ordered.findIndex((item) => item.index === 0), explanation: scenario[1] as string, xp: data.xp }
  }
  const concept = concepts[(counter + 2) % concepts.length]
  const options = [concept.answer, `Uma taxa opcional que sempre gera recompensa`, `Um endereço público que deve ser mantido em segredo`, `Uma função exclusiva de uma exchange`]
  const ordered = options.map((option, index) => ({ option, index })).sort((a, b) => ((a.index + counter) % options.length) - ((b.index + counter) % options.length))
  return { id: `${difficulty}-reasoning-${counter}`, difficulty, category: 'Raciocínio', prompt: `${openers[counter % openers.length]} por que entender ${concept.term} ajuda antes de fazer uma operação on-chain?`, options: ordered.map((item) => item.option), answerIndex: ordered.findIndex((item) => item.index === 0), explanation: `Conhecer ${concept.term} ajuda a avaliar riscos e tomar decisões mais conscientes, sem depender de promessas.`, xp: data.xp }
}

import { recordAnswerToMongo } from './mongoDbService'
import { getCurrentUser } from './demoAuth'

export function getActivityProgress() {
  const saved = localStorage.getItem(PROGRESS_KEY)
  return saved ? JSON.parse(saved) as { xp: number; completed: number; correct: number; answered: number } : { xp: 0, completed: 0, correct: 0, answered: 0 }
}

export function recordAnswer(correct: boolean, xp: number) {
  const progress = getActivityProgress()
  const updated = { xp: progress.xp + (correct ? xp : 0), completed: progress.completed + 1, correct: progress.correct + (correct ? 1 : 0), answered: progress.answered + 1 }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))

  // Persiste no MongoDB para a conta do usuário
  const user = getCurrentUser()
  if (user?.id) {
    recordAnswerToMongo(user.id, {
      questionId: `q-${Date.now()}`,
      isCorrect: correct,
      xpEarned: correct ? xp : 0,
    }).catch(() => {})
  }

  return updated
}

export function getLevelFromXp(xp: number) {
  const level = Math.floor(xp / 100) + 1
  const labels = ['Explorador', 'Aprendiz', 'Praticante', 'Construtor', 'On-chain']
  return { level, label: labels[Math.min(level - 1, labels.length - 1)], next: level * 100 }
}

// Base libera dificuldades por nível; Premium libera todas na demonstração.
export function getRequiredLevel(difficulty: ActivityDifficulty): number {
  return { iniciante: 1, intermediario: 2, avancado: 3 }[difficulty]
}

export function canAccessActivity(difficulty: ActivityDifficulty, userLevel: number, plan: UserPlan): boolean {
  return plan === 'premium' || userLevel >= getRequiredLevel(difficulty)
}

export function getDifficultyLockMessage(difficulty: ActivityDifficulty, userLevel: number, plan: UserPlan): string {
  return canAccessActivity(difficulty, userLevel, plan)
    ? ''
    : `Alcance o nível ${getRequiredLevel(difficulty)} para desbloquear esta atividade.`
}
