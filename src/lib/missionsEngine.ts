import type { UserProfile } from '../types'

export interface StudentMission {
  id: string
  title: string
  shortLabel: string
  description: string
  analogy: string
  xpReward: number
  solReward: number
  tabDestination: 'home' | 'wallet' | 'community' | 'activities' | 'profile'
}

export const STUDENT_MISSIONS: StudentMission[] = [
  {
    id: 'mission_explore_wallet',
    title: 'Descobrir sua Chave Pública',
    shortLabel: 'Seu Pix Cripto',
    description: 'Copie ou visualize o endereço da sua carteira na aba Carteira Prática.',
    analogy: 'A Chave Pública é como seu Pix: serve para você receber moedas sem nenhum perigo.',
    xpReward: 20,
    solReward: 0.1,
    tabDestination: 'wallet',
  },
  {
    id: 'mission_claim_faucet',
    title: 'Pegar Moedas na Torneira (Faucet)',
    shortLabel: 'Moedas de Treino',
    description: 'Solicite +1.0 SOL de teste gratuito para experimentar a rede sem gastar nada.',
    analogy: 'O Faucet é uma torneira pública que dá dinheiro de mentira para você aprender com calma.',
    xpReward: 30,
    solReward: 0.1,
    tabDestination: 'wallet',
  },
  {
    id: 'mission_send_simulation',
    title: 'Fazer o Primeiro Envio On-Chain',
    shortLabel: 'Primeira Transferência',
    description: 'Faça um envio de teste para a colega Ana ou outro destinatário da turma.',
    analogy: 'É como fazer um Pix para um amigo: você vê o saldo sair e a taxa de rede carimbando a entrega.',
    xpReward: 40,
    solReward: 0.1,
    tabDestination: 'wallet',
  },
  {
    id: 'mission_community_chat',
    title: 'Interagir no Chat da Comunidade',
    shortLabel: 'Troca com a Turma',
    description: 'Converse com os colegas online ou mande moedas de teste diretamente no bate-papo.',
    analogy: 'Na Web3, comunidades aprendem juntas tirando dúvidas e trocando experiências em tempo real.',
    xpReward: 35,
    solReward: 0.1,
    tabDestination: 'community',
  },
  {
    id: 'mission_answer_quiz',
    title: 'Desafio no Laboratório',
    shortLabel: 'Aprender Fazendo',
    description: 'Acerte pelo menos uma pergunta prática no Laboratório de Atividades.',
    analogy: 'Exercícios rápidos fixam o conhecimento e colocam XP e moedas de treino na sua carteira.',
    xpReward: 25,
    solReward: 0.05,
    tabDestination: 'activities',
  },
  {
    id: 'mission_security_test',
    title: 'Escudo Anti-Golpe (Cilada ou Seguro?)',
    shortLabel: 'Segurança 101',
    description: 'Complete o simulador anti-golpe para aprender a proteger sua carteira na internet.',
    analogy: 'A regra de ouro: sua Chave Privada é como a senha do banco, você NUNCA compartilha com ninguém!',
    xpReward: 50,
    solReward: 0.15,
    tabDestination: 'activities',
  },
]

export interface SecurityScenario {
  id: string
  title: string
  message: string
  sender: string
  isScam: boolean
  explanation: string
  actionAdvice: string
}

export const SECURITY_SCENARIOS: SecurityScenario[] = [
  {
    id: 'scam_whatsapp_support',
    title: 'Mensagem no WhatsApp pedindo 12 palavras',
    sender: 'WhatsApp de número desconhecido com foto de suporte bancário/cripto',
    message:
      '"Olá! Detectamos uma tentativa de invasão na sua carteira. Para bloquear o criminoso, informe imediatamente as suas 12 palavras secretas para nossa equipe de segurança."',
    isScam: true,
    explanation:
      'GOLPE CLÁSSICO! Nenhum suporte legítimo, aplicativo ou empresa do mundo jamais pedirá suas 12 palavras secretas (Chave Privada). Se você entregar, o golpista assume o controle total da sua carteira.',
    actionAdvice: 'Bloquear o número e nunca digitar as 12 palavras secretas em mensagens ou links suspeitos.',
  },
  {
    id: 'safe_friend_public_key',
    title: 'Colega de turma pedindo para enviar SOL de teste',
    sender: 'Ana (Colega da turma de estudos de Web3)',
    message:
      '"Oi! Aqui está minha chave pública da Solana Devnet: 7xKXtg...sAsU. Consegue me mandar 0.1 SOL de teste para eu ver a transação caindo na minha tela?"',
    isScam: false,
    explanation:
      'É SEGURO! Compartilhar a Chave Pública (endereço) é exatamente como passar a sua Chave Pix. Apenas com a chave pública, ninguém consegue roubar fundos, apenas enviar moedas para você.',
    actionAdvice: 'Pode transferir sem medo. A chave pública foi feita para ser pública.',
  },
  {
    id: 'scam_double_money',
    title: 'Promessa de multiplicar dinheiro em 24 horas',
    sender: 'Anúncio ou perfil no Instagram/Telegram dizendo ser especialista',
    message:
      '"Robô investidor com inteligência artificial garantida! Mande 1 SOL agora para o endereço da empresa e receba 3 SOL de volta amanhã com lucro 100% garantido!"',
    isScam: true,
    explanation:
      'GOLPE DE PIRÂMIDE! Em investimentos e em Web3, não existe lucro fixo garantido, muito menos multiplicar dinheiro da noite para o dia. Quem pede para você mandar moedas com promessa de retorno em dobro vai sumir com seu dinheiro.',
    actionAdvice: 'Desconfie sempre de promessas de dinheiro fácil. Denuncie a postagem imediatamente.',
  },
]

const MISSIONS_STORAGE_KEY = 'abracadabra.completed.missions'

export function getCompletedMissions(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function completeMission(missionId: string): { newlyCompleted: boolean; completedList: string[] } {
  const current = getCompletedMissions()
  if (current.includes(missionId)) {
    return { newlyCompleted: false, completedList: current }
  }
  const updated = [...current, missionId]
  if (typeof window !== 'undefined') {
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(updated))
  }
  return { newlyCompleted: true, completedList: updated }
}
