import type { UserProfile } from '../types'

const DEMO_USERNAME = 'teste123'
const DEMO_PASSWORD = '123'
const SESSION_KEY = 'abracadabra.demo.session'

export const demoUser: UserProfile = {
  id: 'demo-user',
  username: DEMO_USERNAME,
  displayName: 'Usuário teste',
  bio: 'Descobrindo o universo on-chain, um passo de cada vez.',
  avatarUrl: '',
  level: 'Explorador',
  streak: 1,
  xp: 0,
  completedActivities: 0,
  preferences: {
    focus: 'Fundamentos de Web3',
    weeklyDigest: true,
  },
}

export function signInDemo(username: string, password: string) {
  if (username.trim() !== DEMO_USERNAME || password !== DEMO_PASSWORD) return false
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoUser))
  return true
}

export function getCurrentUser(): UserProfile | null {
  const storedUser = sessionStorage.getItem(SESSION_KEY)
  if (!storedUser) return null
  return { ...demoUser, ...JSON.parse(storedUser) as Partial<UserProfile> }
}

export function updateCurrentUser(changes: Partial<UserProfile>) {
  const currentUser = getCurrentUser()
  if (!currentUser) return null
  const updatedUser = { ...currentUser, ...changes }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
  return updatedUser
}

export function signOutDemo() {
  sessionStorage.removeItem(SESSION_KEY)
}

// Futuro: substituir este adaptador local por Supabase Auth e persistir o perfil no banco.
