import type { UserProfile } from '../types'
import { demoUser } from './demoAuth'
import { generateMockDevnetAddress } from './walletAuth'

import { ensurePracticeWallet } from './practiceWallet'

const SESSION_KEY = 'abracadabra.demo.session'
const LOCAL_STORAGE_CLIENT_ID_KEY = 'abracadabra.google.clientId'

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (tokenResponse: any) => void
            error_callback?: (error: any) => void
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void
          }
        }
        id?: any
      }
    }
  }
}

export const DEFAULT_GOOGLE_CLIENT_ID =
  '1044896716521-7a4kvh5qr7vcb7hbqs8gjhocff2t4hkq.apps.googleusercontent.com'

export function getGoogleClientId(): string {
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID?.trim()
  if (envId) return envId
  if (typeof window !== 'undefined') {
    const localId = localStorage.getItem(LOCAL_STORAGE_CLIENT_ID_KEY)?.trim()
    if (localId) return localId
  }
  return DEFAULT_GOOGLE_CLIENT_ID
}

export function saveLocalGoogleClientId(clientId: string): void {
  if (typeof window !== 'undefined') {
    if (clientId.trim()) {
      localStorage.setItem(LOCAL_STORAGE_CLIENT_ID_KEY, clientId.trim())
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CLIENT_ID_KEY)
    }
  }
}

export function isGoogleConfigured(): boolean {
  return Boolean(getGoogleClientId())
}

export interface GoogleUserInfo {
  email: string
  name: string
  picture?: string
  sub?: string
}

export function signInWithGoogleProfile(userInfo: GoogleUserInfo): UserProfile {
  const email = userInfo.email.trim()
  const namePart = userInfo.name || email.split('@')[0]
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')
  const avatarUrl = userInfo.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`

  const embeddedWalletAddress = generateMockDevnetAddress()

  const rawProfile: UserProfile = {
    ...demoUser,
    id: `google-${userInfo.sub || username}`,
    username,
    displayName: namePart,
    email,
    authProvider: 'Google (Gmail)',
    avatarUrl,
    walletAddress: embeddedWalletAddress,
    walletProvider: 'Carteira de Prática (Solana Devnet)',
    network: 'Solana Devnet (Simulada)',
    bio: `Aluno autenticado via conta oficial Google (${email}). Carteira prática ativa com 2.5 SOL de teste.`,
  }

  const profile = ensurePracticeWallet(rawProfile)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile))
  return profile
}

export async function ensureGoogleScriptLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (window.google?.accounts?.oauth2) return true

  return new Promise((resolve) => {
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    let attempts = 0
    const checkInterval = setInterval(() => {
      attempts++
      if (window.google?.accounts?.oauth2) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (attempts > 30) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
  })
}

export async function requestOfficialGoogleLogin({
  onSuccess,
  onError,
}: {
  onSuccess: (profile: UserProfile) => void
  onError: (error: string) => void
}): Promise<boolean> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    onError('Configuração do Google Client ID não encontrada.')
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  // Se a biblioteca do Google ainda não estiver no window, aguarda o carregamento dinâmico
  if (!window.google?.accounts?.oauth2) {
    const loaded = await ensureGoogleScriptLoaded()
    if (!loaded || !window.google?.accounts?.oauth2) {
      onError('Aguarde alguns segundos para a biblioteca do Google carregar e tente novamente.')
      return false
    }
  }

  // O Google OAuth proíbe IPs locais de rede como 192.168.x.x e exige http://localhost:PORT
  // Redireciona APENAS se for um IP privado local. Em produção (Vercel) NÃO redireciona!
  const isPrivateLocalIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(window.location.hostname)
  if (isPrivateLocalIp) {
    const port = window.location.port ? `:${window.location.port}` : ''
    window.location.href = `http://localhost${port}${window.location.pathname}`
    return true
  }

  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          onError(`Erro na autenticação Google: ${tokenResponse.error_description || tokenResponse.error}`)
          return
        }

        if (tokenResponse.access_token) {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            if (!res.ok) {
              throw new Error('Falha ao obter perfil do Google')
            }
            const data = await res.json()
            const profile = signInWithGoogleProfile({
              email: data.email,
              name: data.name,
              picture: data.picture,
              sub: data.sub,
            })
            onSuccess(profile)
          } catch (err: any) {
            onError('Não foi possível obter as informações da sua conta Google.')
          }
        }
      },
      error_callback: (error: any) => {
        onError(`Falha na janela do Google: ${error?.message || 'Acesso cancelado'}`)
      },
    })

    // Abre o popup oficial do Google para o usuário escolher a conta!
    client.requestAccessToken({ prompt: 'select_account' })
    return true
  } catch (err: any) {
    onError(`Erro ao abrir autenticação Google: ${err?.message || err}`)
    return true
  }
}
