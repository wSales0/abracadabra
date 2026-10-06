export type UserPreferences = {
  focus: string
  weeklyDigest: boolean
}

export interface PracticeTransaction {
  id: string
  type: 'faucet' | 'send' | 'receive' | 'reward'
  amount: number
  signature: string
  toOrFrom: string
  timestamp: string
  status: 'confirmada' | 'processando'
  fee?: number
}

export type UserProfile = {
  id: string
  username: string
  displayName: string
  bio: string
  avatarUrl: string
  level: string
  streak: number
  xp: number
  completedActivities: number
  preferences: UserPreferences
  email?: string
  authProvider?: string
  walletAddress?: string
  walletProvider?: string
  network?: string
  practiceBalance?: number
  practiceTransactions?: PracticeTransaction[]
}

export type CryptoNewsItem = {
  id: string
  category: string
  title: string
  summary: string
  source: string
  publishedAt: string
  readTime: string
}

export type MarketCoin = {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap_rank: number
  market_cap: number
  price_change_percentage_24h: number
}

export type CryptoHeadline = {
  id: string
  title: string
  source: string
  publishedAt: string
  category: string
  url: string
}

export type ActivityDifficulty = 'iniciante' | 'intermediario' | 'avancado'

export type ActivityQuestion = {
  id: string
  difficulty: ActivityDifficulty
  category: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  xp: number
}
