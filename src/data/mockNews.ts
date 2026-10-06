import type { CryptoNewsItem } from '../types'

export const mockNews: CryptoNewsItem[] = [
  {
    id: 'solana-basics',
    category: 'Fundamentos',
    title: 'Por que uma blockchain precisa de uma wallet?',
    summary: 'Entenda o papel da carteira e por que ela é o primeiro passo para interagir com uma rede.',
    source: 'Abracadabra',
    publishedAt: 'Hoje',
    readTime: '4 min',
  },
  {
    id: 'onchain-language',
    category: 'On-chain',
    title: 'O que está por trás de uma transação?',
    summary: 'Uma visão simples dos dados que circulam quando uma ação acontece na blockchain.',
    source: 'Abracadabra',
    publishedAt: 'Hoje',
    readTime: '6 min',
  },
  {
    id: 'solana-ecosystem',
    category: 'Ecossistema',
    title: 'Solana em linguagem de gente',
    summary: 'Conheça os conceitos que aparecem com frequência no ecossistema sem precisar decorar jargões.',
    source: 'Abracadabra',
    publishedAt: 'Ontem',
    readTime: '5 min',
  },
]

// Futuro: substituir este mock por uma consulta paginada em uma tabela do Supabase.
