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
