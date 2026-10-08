import type { CryptoHeadline, MarketCoin } from '../types'

const API_BASE = 'https://cryptocurrency.cv/api'

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) throw new Error(`API respondeu ${response.status}`)
  return response.json() as Promise<T>
}

type MarketResponse = { coins: MarketCoin[] }
type NewsResponse = { articles: Array<{ title?: string; link?: string; source?: string; pubDate?: string; category?: string }> }

export async function getMarketCoins() {
  const data = await getJson<MarketResponse>('/market/coins?limit=8')
  return data.coins ?? []
}

export async function getRelatedHeadlines(coin: MarketCoin) {
  const categories = new Set(['bitcoin', 'ethereum', 'solana', 'defi', 'web3'])
  const path = categories.has(coin.id)
    ? `/news?category=${encodeURIComponent(coin.id)}&limit=5`
    : `/news?search=${encodeURIComponent(`${coin.name} ${coin.symbol}`)}&limit=5`
  const data = await getJson<NewsResponse>(path)
  return (data.articles ?? []).flatMap((article, index) => {
    if (!article.title || !article.link) return []
    return [{
      id: `${coin.id}-${index}-${article.link}`,
      title: article.title,
      source: article.source || 'Fonte original',
      publishedAt: article.pubDate || '',
      category: article.category || 'Web3',
      url: article.link,
    }]
  })
}

export interface SolanaPriceData {
  brl: number
  usd: number
  change24hBrl: number
  change24hUsd: number
  lastUpdated: number
}

const FALLBACK_SOL_PRICE: SolanaPriceData = {
  brl: 890.5,
  usd: 152.2,
  change24hBrl: 3.42,
  change24hUsd: 3.15,
  lastUpdated: Date.now(),
}

let cachedPrice: SolanaPriceData | null = null
let cacheTimestamp = 0

export async function getSolanaPrice(): Promise<SolanaPriceData> {
  const now = Date.now()
  if (cachedPrice && now - cacheTimestamp < 30000) {
    return cachedPrice
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=brl,usd&include_24hr_change=true',
      {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json()
      if (data && data.solana && typeof data.solana.brl === 'number') {
        const fresh: SolanaPriceData = {
          brl: data.solana.brl,
          usd: data.solana.usd,
          change24hBrl: Number((data.solana.brl_24h_change || 0).toFixed(2)),
          change24hUsd: Number((data.solana.usd_24h_change || 0).toFixed(2)),
          lastUpdated: now,
        }
        cachedPrice = fresh
        cacheTimestamp = now
        return fresh
      }
    }
  } catch {
    // Silently fall back to cached or default price
  }

  return cachedPrice || FALLBACK_SOL_PRICE
}
