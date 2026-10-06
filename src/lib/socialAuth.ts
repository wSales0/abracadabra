import type { UserProfile } from '../types'
import { demoUser } from './demoAuth'
import { generateMockDevnetAddress } from './walletAuth'

const SESSION_KEY = 'abracadabra.demo.session'

export function signInWithSocial(
  provider: 'google' | 'github' | 'discord',
  emailOrName?: string
): UserProfile {
  let email = emailOrName?.trim() || ''
  let displayName = 'Aluno Web3'
  let username = 'alunoweb3'
  let avatarUrl = ''

  if (provider === 'google') {
    if (!email) email = 'aluno@gmail.com'
    const namePart = email.split('@')[0]
    displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
    username = namePart.toLowerCase().replace(/[^a-z0-9]/g, '_')
    avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
  } else if (provider === 'github') {
    if (!email) email = 'dev.web3@github.com'
    displayName = 'Dev GitHub'
    username = 'dev_github'
    avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`
  } else if (provider === 'discord') {
    if (!email) email = 'explorer@discord.gg'
    displayName = 'Membro Discord'
    username = 'discord_explorer'
    avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
  }

  // Gera uma carteira embutida (Embedded Solana Wallet) estilo Privy / Dynamic
  const embeddedWalletAddress = generateMockDevnetAddress()

  const profile: UserProfile = {
    ...demoUser,
    id: `${provider}-${username}`,
    username,
    displayName,
    email,
    authProvider: provider === 'google' ? 'Google (Gmail)' : provider === 'github' ? 'GitHub' : 'Discord',
    avatarUrl,
    walletAddress: embeddedWalletAddress,
    walletProvider: 'Carteira Embutida (Embedded Solana)',
    network: 'Solana Devnet',
    bio: `Aluno autenticado via ${provider === 'google' ? 'Google' : provider}. Carteira Solana ativa na Devnet.`,
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile))
  return profile
}
