import type { UserProfile } from '../types'
import { demoUser } from './demoAuth'

const SESSION_KEY = 'abracadabra.demo.session'

export type SupportedWallet = 'phantom' | 'solflare' | 'backpack' | 'coinbase' | 'simulated'

export interface WalletProviderInfo {
  id: SupportedWallet
  name: string
  icon: string
  description: string
  isInstalled: () => boolean
}

export function getPhantomProvider() {
  if (typeof window === 'undefined') return null
  const anyWindow = window as any
  if (anyWindow.phantom?.solana?.isPhantom) {
    return anyWindow.phantom.solana
  }
  if (anyWindow.solana?.isPhantom) {
    return anyWindow.solana
  }
  return null
}

export function getSolflareProvider() {
  if (typeof window === 'undefined') return null
  const anyWindow = window as any
  if (anyWindow.solflare?.isSolflare) {
    return anyWindow.solflare
  }
  return null
}

export function getBackpackProvider() {
  if (typeof window === 'undefined') return null
  const anyWindow = window as any
  return anyWindow.backpack || null
}

export function getCoinbaseProvider() {
  if (typeof window === 'undefined') return null
  const anyWindow = window as any
  return anyWindow.coinbaseSolana || null
}

export const SUPPORTED_WALLETS: WalletProviderInfo[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '🟣',
    description: 'A carteira mais popular da Solana',
    isInstalled: () => Boolean(getPhantomProvider()),
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '🔥',
    description: 'Segurança e agilidade no ecossistema Solana',
    isInstalled: () => Boolean(getSolflareProvider()),
  },
  {
    id: 'backpack',
    name: 'Backpack',
    icon: '🎒',
    description: 'Carteira moderna para xNFTs e Solana',
    isInstalled: () => Boolean(getBackpackProvider()),
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Conecte sua conta ou carteira da Coinbase',
    isInstalled: () => Boolean(getCoinbaseProvider()),
  },
  {
    id: 'simulated',
    name: 'Carteira Demo (Solana Devnet)',
    icon: '⚡',
    description: 'Gere uma carteira de teste instantânea sem extensão',
    isInstalled: () => true,
  },
]

export function formatAddress(address: string, sliceSize = 4): string {
  if (!address) return ''
  if (address.length <= sliceSize * 2 + 2) return address
  return `${address.slice(0, sliceSize)}...${address.slice(-sliceSize)}`
}

export function isValidSolanaAddress(address: string): boolean {
  const trimmed = address.trim()
  // Solana Base58 public keys are between 32 and 44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return base58Regex.test(trimmed)
}

export function generateMockDevnetAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let addr = ''
  for (let i = 0; i < 44; i++) {
    addr += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return addr
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 12000, errorMsg = 'Tempo limite esgotado.'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs)),
  ])
}

export async function connectWallet(walletId: SupportedWallet): Promise<{ address: string; providerName: string }> {
  if (walletId === 'simulated') {
    const existingAddress = sessionStorage.getItem('abracadabra.simulated.wallet')
    const address = existingAddress || generateMockDevnetAddress()
    sessionStorage.setItem('abracadabra.simulated.wallet', address)
    return { address, providerName: 'Solana Devnet (Demo)' }
  }

  if (walletId === 'phantom') {
    const provider = getPhantomProvider()
    if (!provider) {
      window.open('https://phantom.app/', '_blank')
      throw new Error('Extensão Phantom não detectada. Instale ou abra a extensão no seu navegador.')
    }

    try {
      const connectionPromise = provider.connect({ onlyIfTrusted: false }) as Promise<any>
      const response = await withTimeout(
        connectionPromise,
        15000,
        'A Phantom não abriu o popup de aprovação. Verifique se o ícone da Phantom na barra do navegador tem uma notificação pendente ou use a opção "Colar Endereço".'
      )
      const pubKey = response?.publicKey || (provider as any).publicKey
      const address = pubKey ? pubKey.toString() : ''
      if (!address) throw new Error('Não foi possível obter a chave pública da Phantom.')
      return { address, providerName: 'Phantom' }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 4001) {
        throw new Error('Conexão recusada na extensão Phantom.')
      }
      if (err instanceof Error) throw err
      throw new Error('Erro ao conectar com a Phantom.')
    }
  }

  if (walletId === 'solflare') {
    const provider = getSolflareProvider()
    if (!provider) {
      window.open('https://solflare.com/', '_blank')
      throw new Error('Extensão Solflare não detectada.')
    }

    try {
      await withTimeout(
        provider.connect(),
        15000,
        'A Solflare não respondeu a tempo. Verifique se o popup está aberto.'
      )
      const pubKey = (provider as any).publicKey
      const address = pubKey ? pubKey.toString() : ''
      if (!address) throw new Error('Não foi possível obter a chave pública da Solflare.')
      return { address, providerName: 'Solflare' }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 4001) {
        throw new Error('Conexão recusada na extensão Solflare.')
      }
      if (err instanceof Error) throw err
      throw new Error('Erro ao conectar com a Solflare.')
    }
  }

  if (walletId === 'backpack') {
    const provider = getBackpackProvider()
    if (!provider) {
      window.open('https://backpack.app/', '_blank')
      throw new Error('Extensão Backpack não detectada.')
    }
    const res = await withTimeout((provider as any).connect(), 15000, 'A Backpack não respondeu a tempo.') as any
    const address = res?.publicKey ? res.publicKey.toString() : ''
    return { address, providerName: 'Backpack' }
  }

  if (walletId === 'coinbase') {
    const provider = getCoinbaseProvider()
    if (!provider) {
      window.open('https://www.coinbase.com/wallet', '_blank')
      throw new Error('Coinbase Wallet não detectada.')
    }
    const res = await withTimeout((provider as any).connect(), 15000, 'A Coinbase Wallet não respondeu a tempo.') as any
    const address = res?.publicKey ? res.publicKey.toString() : ''
    return { address, providerName: 'Coinbase Wallet' }
  }

  throw new Error('Provedor de carteira não suportado.')
}

export function signInWithWallet(walletAddress: string, providerName: string): UserProfile {
  const short = formatAddress(walletAddress, 4)
  const profile: UserProfile = {
    ...demoUser,
    id: `wallet-${walletAddress.slice(0, 12)}`,
    username: short.toLowerCase().replace('...', '_'),
    displayName: `Carteira ${short}`,
    bio: `Conectado via ${providerName} na Solana Devnet. Pronto para a jornada on-chain.`,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
    walletAddress,
    walletProvider: providerName,
    network: 'Solana Devnet',
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile))
  return profile
}
