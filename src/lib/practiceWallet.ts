import type { PracticeTransaction, UserProfile } from '../types'
import { generateMockDevnetAddress } from './walletAuth'
import { saveUserToMongo } from './mongoDbService'

const SESSION_KEY = 'abracadabra.demo.session'

export interface SampleRecipient {
  name: string
  address: string
  role: string
}

export const SAMPLE_RECIPIENTS: SampleRecipient[] = [
  {
    name: 'Ana (Colega de Turma)',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    role: 'Aluna iniciante em Web3',
  },
  {
    name: 'Professor On-Chain',
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    role: 'Tutor de Laboratório',
  },
  {
    name: 'Cofre DeFi Educacional',
    address: '4Nd1mBQtrMJVYVfKf2PJy9NZWMdBcD9Gz8LqKsVzT1mB',
    role: 'Smart Contract de Demonstração',
  },
]

export function generateMockSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let sig = ''
  for (let i = 0; i < 64; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sig
}

export function ensurePracticeWallet(user: UserProfile): UserProfile {
  let modified = false
  const updated: UserProfile = { ...user }

  if (!updated.walletAddress) {
    updated.walletAddress = generateMockDevnetAddress()
    updated.walletProvider = 'Carteira de Prática (Solana Devnet)'
    updated.network = 'Solana Devnet (Simulada)'
    modified = true
  }

  if (typeof updated.practiceBalance !== 'number') {
    updated.practiceBalance = 2.5
    modified = true
  }

  if (!updated.tokens) {
    updated.tokens = { USDC: 150.0, ABRA: 500.0, BTC: 0.0015 }
    modified = true
  }

  if (typeof updated.stakedBalance !== 'number') {
    updated.stakedBalance = 0
    modified = true
  }

  if (typeof updated.stakingRewards !== 'number') {
    updated.stakingRewards = 0
    modified = true
  }

  if (!updated.badges || updated.badges.length === 0) {
    updated.badges = ['badge_welcome']
    modified = true
  }

  if (!updated.nftCertificate) {
    updated.nftCertificate = {
      minted: false,
      title: 'Certificado de Conclusão Web3 & Blockchain (Solana Devnet)',
    }
    modified = true
  }

  if (!updated.practiceTransactions || updated.practiceTransactions.length === 0) {
    updated.practiceTransactions = [
      {
        id: `tx-genesis-${Date.now()}`,
        type: 'faucet',
        amount: 2.5,
        signature: generateMockSignature(),
        toOrFrom: 'Devnet Airdrop Educacional (Boas-vindas)',
        timestamp: new Date().toISOString(),
        status: 'confirmada',
        fee: 0,
      },
    ]
    modified = true
  }

  if (modified) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  }

  return updated
}

export function claimPracticeFaucet(
  user: UserProfile,
  amount = 1.0
): { updatedUser: UserProfile; transaction: PracticeTransaction } {
  const currentBalance = typeof user.practiceBalance === 'number' ? user.practiceBalance : 2.5
  const newBalance = Number((currentBalance + amount).toFixed(4))

  const tx: PracticeTransaction = {
    id: `tx-faucet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'faucet',
    amount,
    signature: generateMockSignature(),
    toOrFrom: 'Solana Devnet Faucet (Simulado)',
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0,
  }

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newBalance,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { updatedUser, transaction: tx }
}

export function sendPracticeSol(
  user: UserProfile,
  recipientAddress: string,
  amount: number
): { success: boolean; error?: string; updatedUser?: UserProfile; transaction?: PracticeTransaction; adjustedNotice?: string } {
  const currentBalance = typeof user.practiceBalance === 'number' ? user.practiceBalance : 2.5
  const networkFee = 0.000005

  const cleanRecipient = recipientAddress.trim()
  if (!cleanRecipient || cleanRecipient.length < 20) {
    return {
      success: false,
      error: 'Endereço de destino inválido. Insira uma chave pública Solana válida (32 a 44 caracteres).',
    }
  }

  if (amount <= 0 || isNaN(amount)) {
    return {
      success: false,
      error: 'O valor da transferência deve ser um número maior que zero.',
    }
  }

  let finalAmount = amount
  let adjustedNotice: string | undefined

  if (amount + networkFee > currentBalance) {
    const maxSendable = Number((currentBalance - networkFee).toFixed(6))
    if (amount <= currentBalance && maxSendable > 0) {
      finalAmount = maxSendable
      adjustedNotice = `Ajustamos automaticamente para ${finalAmount} SOL para descontar a taxa de rede.`
    } else {
      return {
        success: false,
        error: `Saldo insuficiente. Seu saldo é ${currentBalance.toFixed(4)} SOL e o máximo que você pode enviar é ${maxSendable > 0 ? maxSendable.toFixed(6) : 0} SOL (descontando a taxa de rede de ${networkFee} SOL).`,
      }
    }
  }

  const newBalance = Number(Math.max(0, currentBalance - finalAmount - networkFee).toFixed(6))
  const tx: PracticeTransaction = {
    id: `tx-send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'send',
    amount: finalAmount,
    signature: generateMockSignature(),
    toOrFrom: cleanRecipient,
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: networkFee,
  }

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newBalance,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { success: true, updatedUser, transaction: tx, adjustedNotice }
}

export function rewardPracticeActivity(
  user: UserProfile,
  rewardAmount = 0.05,
  activityTitle = 'Laboratório Web3'
): { updatedUser: UserProfile; transaction: PracticeTransaction } {
  const currentBalance = typeof user.practiceBalance === 'number' ? user.practiceBalance : 2.5
  const newBalance = Number((currentBalance + rewardAmount).toFixed(4))

  const tx: PracticeTransaction = {
    id: `tx-reward-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'reward',
    amount: rewardAmount,
    signature: generateMockSignature(),
    toOrFrom: `Recompensa: ${activityTitle}`,
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0,
  }

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newBalance,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { updatedUser, transaction: tx }
}

export function resetPracticeWallet(user: UserProfile): UserProfile {
  const newAddress = generateMockDevnetAddress()
  const genesisTx: PracticeTransaction = {
    id: `tx-genesis-${Date.now()}`,
    type: 'faucet',
    amount: 2.5,
    signature: generateMockSignature(),
    toOrFrom: 'Devnet Airdrop Educacional (Reset)',
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0,
  }

  const updatedUser: UserProfile = {
    ...user,
    walletAddress: newAddress,
    practiceBalance: 2.5,
    practiceTransactions: [genesisTx],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return updatedUser
}

export function receivePracticeSol(
  user: UserProfile,
  senderName: string,
  amount: number,
  signature: string
): { updatedUser: UserProfile; transaction: PracticeTransaction } {
  const currentBalance = typeof user.practiceBalance === 'number' ? user.practiceBalance : 2.5
  const newBalance = Number((currentBalance + amount).toFixed(6))

  const tx: PracticeTransaction = {
    id: `tx-recv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'receive',
    amount,
    signature,
    toOrFrom: `Recebido de ${senderName}`,
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0,
  }

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newBalance,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { updatedUser, transaction: tx }
}

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
  category: 'iniciante' | 'pratica' | 'seguranca' | 'mestre'
}

export const PLATFORM_BADGES: BadgeDefinition[] = [
  {
    id: 'badge_welcome',
    title: 'Boas-Vindas Web3',
    description: 'Criou sua carteira didática na Solana Devnet.',
    icon: '🎓',
    category: 'iniciante',
  },
  {
    id: 'badge_faucet_master',
    title: 'Mestre da Torneira',
    description: 'Solicitou moedas gratuitas no Faucet simulado.',
    icon: '💧',
    category: 'iniciante',
  },
  {
    id: 'badge_first_transfer',
    title: 'Pioneiro On-Chain',
    description: 'Completou sua primeira transferência na rede.',
    icon: '⚡',
    category: 'pratica',
  },
  {
    id: 'badge_swap_trader',
    title: 'Trader do Futuro',
    description: 'Executou uma troca de tokens (Swap) em corretora descentralizada.',
    icon: '🔄',
    category: 'pratica',
  },
  {
    id: 'badge_validator',
    title: 'Validador da Rede',
    description: 'Fez staking educativo e protegeu o consenso Proof-of-Stake.',
    icon: '🌱',
    category: 'pratica',
  },
  {
    id: 'badge_anti_scam',
    title: 'Escudo Anti-Golpe',
    description: 'Concluiu o treinamento prático de defesa contra golpes.',
    icon: '🛡️',
    category: 'seguranca',
  },
  {
    id: 'badge_seed_guardian',
    title: 'Guardião da Frase Secreta',
    description: 'Reconstruiu com sucesso as 12 palavras secretas no cofre de backup.',
    icon: '🔐',
    category: 'seguranca',
  },
  {
    id: 'badge_blockchain_doctor',
    title: 'Médico da Blockchain',
    description: 'Diagnosticou e resolveu com sucesso erros reais de rede e taxas.',
    icon: '🩺',
    category: 'seguranca',
  },
  {
    id: 'badge_nft_graduate',
    title: 'Graduado Web3',
    description: 'Cunhou seu Certificado Oficial de Conclusão como NFT na Devnet.',
    icon: '📜',
    category: 'mestre',
  },
]

export const SWAP_RATES: Record<string, number> = {
  USDC: 150,    // 1 SOL = 150 USDC
  ABRA: 1000,   // 1 SOL = 1000 ABRA
  BTC: 0.0022,  // 1 SOL = 0.0022 BTC
}

export function swapPracticeTokens(
  user: UserProfile,
  fromSymbol: 'SOL' | 'USDC' | 'ABRA' | 'BTC',
  toSymbol: 'SOL' | 'USDC' | 'ABRA' | 'BTC',
  fromAmount: number
): { success: boolean; error?: string; updatedUser?: UserProfile; transaction?: PracticeTransaction; receivedAmount?: number } {
  if (fromSymbol === toSymbol) {
    return { success: false, error: 'Selecione duas moedas diferentes para a troca.' }
  }
  if (fromAmount <= 0 || isNaN(fromAmount)) {
    return { success: false, error: 'Informe um valor maior que zero.' }
  }

  const networkFee = 0.000005
  const currentSol = user.practiceBalance ?? 2.5
  const currentTokens = { USDC: 150, ABRA: 500, BTC: 0.0015, ...(user.tokens || {}) }

  let receivedAmount = 0
  let newSol = currentSol
  const newTokens = { ...currentTokens }

  if (fromSymbol === 'SOL') {
    if (fromAmount + networkFee > currentSol) {
      return { success: false, error: `Saldo insuficiente de SOL. Você tem ${currentSol.toFixed(4)} SOL (precisa incluir a taxa de rede de ${networkFee} SOL).` }
    }
    newSol = Number((currentSol - fromAmount - networkFee).toFixed(6))
    const rate = SWAP_RATES[toSymbol] || 1
    receivedAmount = Number((fromAmount * rate).toFixed(toSymbol === 'BTC' ? 6 : 2))
    newTokens[toSymbol as keyof typeof newTokens] = Number((newTokens[toSymbol as keyof typeof newTokens] + receivedAmount).toFixed(toSymbol === 'BTC' ? 6 : 2))
  } else if (toSymbol === 'SOL') {
    const userBalanceOfToken = currentTokens[fromSymbol as keyof typeof currentTokens] || 0
    if (fromAmount > userBalanceOfToken) {
      return { success: false, error: `Saldo insuficiente de $${fromSymbol}. Você tem ${userBalanceOfToken} ${fromSymbol}.` }
    }
    if (currentSol < networkFee) {
      return { success: false, error: `Você precisa de pelo menos ${networkFee} SOL na carteira para pagar a taxa de rede da transação.` }
    }
    newTokens[fromSymbol as keyof typeof newTokens] = Number((userBalanceOfToken - fromAmount).toFixed(fromSymbol === 'BTC' ? 6 : 2))
    const rate = SWAP_RATES[fromSymbol] || 1
    receivedAmount = Number((fromAmount / rate).toFixed(6))
    newSol = Number((currentSol - networkFee + receivedAmount).toFixed(6))
  } else {
    const userBalanceOfToken = currentTokens[fromSymbol as keyof typeof currentTokens] || 0
    if (fromAmount > userBalanceOfToken) {
      return { success: false, error: `Saldo insuficiente de $${fromSymbol}.` }
    }
    if (currentSol < networkFee) {
      return { success: false, error: `Você precisa de ${networkFee} SOL para a taxa de rede.` }
    }
    newSol = Number((currentSol - networkFee).toFixed(6))
    newTokens[fromSymbol as keyof typeof newTokens] = Number((userBalanceOfToken - fromAmount).toFixed(fromSymbol === 'BTC' ? 6 : 2))
    const solEquiv = fromAmount / (SWAP_RATES[fromSymbol] || 1)
    receivedAmount = Number((solEquiv * (SWAP_RATES[toSymbol] || 1)).toFixed(toSymbol === 'BTC' ? 6 : 2))
    newTokens[toSymbol as keyof typeof newTokens] = Number((newTokens[toSymbol as keyof typeof newTokens] + receivedAmount).toFixed(toSymbol === 'BTC' ? 6 : 2))
  }

  const tx: PracticeTransaction = {
    id: `tx-swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'swap',
    amount: fromAmount,
    signature: generateMockSignature(),
    toOrFrom: `Swap: ${fromAmount} ${fromSymbol} ➔ ${receivedAmount} ${toSymbol} (DEX Abracadabra)`,
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: networkFee,
    tokenSymbol: fromSymbol,
  }

  const currentBadges = user.badges || []
  const newBadges = currentBadges.includes('badge_swap_trader') ? currentBadges : [...currentBadges, 'badge_swap_trader']

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newSol,
    tokens: newTokens,
    xp: (user.xp || 0) + 15,
    badges: newBadges,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { success: true, updatedUser, transaction: tx, receivedAmount }
}

export function stakePracticeSol(
  user: UserProfile,
  amount: number
): { success: boolean; error?: string; updatedUser?: UserProfile; transaction?: PracticeTransaction } {
  const currentSol = user.practiceBalance ?? 2.5
  const networkFee = 0.000005

  if (amount <= 0 || isNaN(amount)) {
    return { success: false, error: 'Informe um valor válido em SOL para colocar em staking.' }
  }
  if (amount + networkFee > currentSol) {
    return { success: false, error: `Saldo insuficiente. Você tem ${currentSol.toFixed(4)} SOL e a taxa de rede é ${networkFee} SOL.` }
  }

  const newSol = Number((currentSol - amount - networkFee).toFixed(6))
  const currentStaked = user.stakedBalance || 0
  const newStaked = Number((currentStaked + amount).toFixed(6))

  const tx: PracticeTransaction = {
    id: `tx-stake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'stake',
    amount,
    signature: generateMockSignature(),
    toOrFrom: 'Validador Didático Abracadabra (Proof-of-Stake)',
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: networkFee,
  }

  const currentBadges = user.badges || []
  const newBadges = currentBadges.includes('badge_validator') ? currentBadges : [...currentBadges, 'badge_validator']

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newSol,
    stakedBalance: newStaked,
    stakedAt: new Date().toISOString(),
    xp: (user.xp || 0) + 20,
    badges: newBadges,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { success: true, updatedUser, transaction: tx }
}

export function unstakePracticeSol(
  user: UserProfile,
  amount: number
): { success: boolean; error?: string; updatedUser?: UserProfile; transaction?: PracticeTransaction } {
  const currentStaked = user.stakedBalance || 0
  if (amount <= 0 || isNaN(amount)) {
    return { success: false, error: 'Informe um valor válido para retirar do staking.' }
  }
  if (amount > currentStaked) {
    return { success: false, error: `Você possui apenas ${currentStaked.toFixed(4)} SOL em staking.` }
  }

  const currentSol = user.practiceBalance ?? 2.5
  const newStaked = Number((currentStaked - amount).toFixed(6))
  const newSol = Number((currentSol + amount).toFixed(6))

  const tx: PracticeTransaction = {
    id: `tx-unstake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'unstake',
    amount,
    signature: generateMockSignature(),
    toOrFrom: 'Resgate de Staking: Validador Abracadabra',
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0,
  }

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newSol,
    stakedBalance: newStaked,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { success: true, updatedUser, transaction: tx }
}

export function claimStakingRewards(
  user: UserProfile,
  rewardAmount = 0.025
): { success: boolean; error?: string; updatedUser?: UserProfile; transaction?: PracticeTransaction; rewardAmount?: number } {
  const currentStaked = user.stakedBalance || 0
  if (currentStaked <= 0) {
    return { success: false, error: 'Você precisa ter SOL em staking para gerar recompensas de validação.' }
  }

  const currentSol = user.practiceBalance ?? 2.5
  const newSol = Number((currentSol + rewardAmount).toFixed(6))

  const tx: PracticeTransaction = {
    id: `tx-reward-stake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'reward',
    amount: rewardAmount,
    signature: generateMockSignature(),
    toOrFrom: 'Recompensa de Bloco PoS (Validador Abracadabra)',
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0,
  }

  const updatedUser: UserProfile = {
    ...user,
    practiceBalance: newSol,
    xp: (user.xp || 0) + 15,
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { success: true, updatedUser, transaction: tx, rewardAmount }
}

export function mintPracticeNftCertificate(
  user: UserProfile
): { success: boolean; updatedUser: UserProfile; transaction: PracticeTransaction; mintAddress: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let mintSuffix = ''
  for (let i = 0; i < 16; i++) {
    mintSuffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const mintAddress = `CERT_${mintSuffix}_DEVNET`

  const tx: PracticeTransaction = {
    id: `tx-nft-${Date.now()}`,
    type: 'reward',
    amount: 0,
    signature: generateMockSignature(),
    toOrFrom: `NFT Mint: Certificado Web3 (#${mintAddress.slice(0, 10)})`,
    timestamp: new Date().toISOString(),
    status: 'confirmada',
    fee: 0.000005,
  }

  const currentBadges = user.badges || []
  const newBadges = currentBadges.includes('badge_nft_graduate') ? currentBadges : [...currentBadges, 'badge_nft_graduate']

  const updatedUser: UserProfile = {
    ...user,
    xp: (user.xp || 0) + 100,
    badges: newBadges,
    nftCertificate: {
      minted: true,
      mintAddress,
      mintedAt: new Date().toISOString(),
      title: 'Certificado de Conclusão Web3 & Blockchain (Solana Devnet)',
    },
    practiceTransactions: [tx, ...(user.practiceTransactions || [])],
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { success: true, updatedUser, transaction: tx, mintAddress }
}

export function unlockUserBadge(
  user: UserProfile,
  badgeId: string
): { updatedUser: UserProfile; newlyUnlocked: boolean } {
  const currentBadges = user.badges || []
  if (currentBadges.includes(badgeId)) {
    return { updatedUser: user, newlyUnlocked: false }
  }

  const updatedUser: UserProfile = {
    ...user,
    badges: [...currentBadges, badgeId],
    xp: (user.xp || 0) + 25,
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  saveUserToMongo(updatedUser).catch(() => {})
  return { updatedUser, newlyUnlocked: true }
}


