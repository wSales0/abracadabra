export type UserPlan = 'base' | 'premium'

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

export interface ChatTransfer {
  amount: number
  signature: string
  recipientName: string
  recipientAddress: string
}

export interface CryptoTransferEvent {
  id: string
  recipientAddress: string
  recipientName?: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderAddress: string
  amount: number
  signature: string
  timestamp: string
}

export interface UnreadTransferNotification {
  id: string
  senderName: string
  amount: number
  signature: string
  timestamp: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  text: string
  timestamp: string
  transfer?: ChatTransfer
}

export interface OnlineStudent {
  id: string
  name: string
  role: string
  avatarUrl?: string
  walletAddress: string
  status: 'online' | 'estudando' | 'iniciante'
  xp: number
  isCurrentUser?: boolean
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
  plan: UserPlan
  preferences: UserPreferences
  email?: string
  authProvider?: string
  walletAddress?: string
  walletProvider?: string
  network?: string
  practiceBalance?: number
  practiceTransactions?: PracticeTransaction[]
  completedMissions?: string[]
  fontSize?: 'normal' | 'large' | 'xlarge'
  unreadTransfer?: UnreadTransferNotification
  soundEffectsEnabled?: boolean
  speechEnabled?: boolean
}

export interface LeaderboardUser {
  rank: number
  id: string
  name: string
  avatarUrl?: string
  level: string
  xp: number
  completedActivities: number
  walletAddress?: string
  lastSeen?: string
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
