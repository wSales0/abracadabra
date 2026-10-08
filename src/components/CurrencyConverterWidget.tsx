import { useState, useEffect } from 'react'
import { getSolanaPrice, type SolanaPriceData } from '../lib/cryptoApi'

interface CurrencyConverterWidgetProps {
  userBalance?: number
}

export function CurrencyConverterWidget({ userBalance = 2.5 }: CurrencyConverterWidgetProps) {
  const [priceData, setPriceData] = useState<SolanaPriceData | null>(null)
  const [solInput, setSolInput] = useState<string>(userBalance.toFixed(2))
  const [brlInput, setBrlInput] = useState<string>('')
  const [lastEdited, setLastEdited] = useState<'sol' | 'brl'>('sol')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getSolanaPrice().then((data) => {
      if (isMounted) {
        setPriceData(data)
        setLoading(false)
        const brlVal = (userBalance * data.brl).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        setBrlInput(brlVal)
      }
    })
    return () => {
      isMounted = false
    }
  }, [userBalance])

  function handleSolChange(val: string) {
    setSolInput(val)
    setLastEdited('sol')
    const num = parseFloat(val.replace(',', '.'))
    if (!isNaN(num) && priceData) {
      setBrlInput((num * priceData.brl).toFixed(2))
    } else {
      setBrlInput('')
    }
  }

  function handleBrlChange(val: string) {
    setBrlInput(val)
    setLastEdited('brl')
    const num = parseFloat(val.replace(',', '.'))
    if (!isNaN(num) && priceData && priceData.brl > 0) {
      setSolInput((num / priceData.brl).toFixed(4))
    } else {
      setSolInput('')
    }
  }

  const solPriceBrl = priceData?.brl ?? 890.5
  const solPriceUsd = priceData?.usd ?? 152.2
  const change24h = priceData?.change24hBrl ?? 3.42
  const isPositive = change24h >= 0

  const userBrlTotal = (userBalance * solPriceBrl).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <section className="converter-card" aria-label="Cotação e Conversor em Tempo Real">
      <div className="converter-header">
        <div className="converter-title-col">
          <div className="converter-tag-row">
            <span className="badge-live-price">🟢 COTAÇÃO DO SOL EM TEMPO REAL</span>
            <span className="source-tag">via CoinGecko</span>
          </div>
          <div className="converter-rate-row">
            <strong>1 SOL = R$ {solPriceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span className="usd-rate">(${solPriceUsd.toFixed(2)} USD)</span>
            <span className={`change-pill ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '▲ +' : '▼ '}
              {change24h}% (24h)
            </span>
          </div>
        </div>

        <div className="user-fiat-balance-badge">
          <span>Seu saldo simulado em Reais:</span>
          <strong>R$ {userBrlTotal}</strong>
          <small>Baseado em {userBalance.toFixed(2)} SOL de treino</small>
        </div>
      </div>

      <div className="converter-interactive-body">
        <div className="converter-input-group">
          <label htmlFor="conv-sol">Quantidade em SOL:</label>
          <div className="input-with-symbol">
            <span className="input-symbol">◎</span>
            <input
              id="conv-sol"
              type="text"
              inputMode="decimal"
              value={solInput}
              onChange={(e) => handleSolChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="converter-arrow-indicator">
          <span>⇆</span>
        </div>

        <div className="converter-input-group">
          <label htmlFor="conv-brl">Equivalente em Reais (R$):</label>
          <div className="input-with-symbol">
            <span className="input-symbol">R$</span>
            <input
              id="conv-brl"
              type="text"
              inputMode="decimal"
              value={brlInput}
              onChange={(e) => handleBrlChange(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      <div className="converter-footer-note">
        <span className="note-icon">💡</span>
        <p>
          <strong>Dica Didática:</strong> Na rede real de criptomoedas, os valores oscilam a cada segundo conforme a oferta e a demanda mundial. Aqui na Abracadabra, você pratica sem gastar seu dinheiro real!
        </p>
      </div>
    </section>
  )
}
