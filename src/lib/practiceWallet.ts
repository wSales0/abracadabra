import type { PracticeTransaction, UserProfile } from '../types'
import { generateMockDevnetAddress } from './walletAuth'

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
  return { updatedUser, transaction: tx }
}

