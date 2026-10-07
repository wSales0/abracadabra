import { useState } from 'react'

interface WalletQrModalProps {
  walletAddress: string
  userName: string
  onClose: () => void
}

export function WalletQrModal({ walletAddress, userName, onClose }: WalletQrModalProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // URL para imagem de QR code com fallbacks limpos
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(walletAddress)}&color=09090f&bgcolor=ffffff`

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-gradient-to-b from-[#19142e] to-[#0c0c16] border border-violet-500/30 rounded-2xl p-6 shadow-2xl relative text-white text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition"
        >
          ✕
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-2xl mb-3">
          📱
        </div>

        <h2 className="text-lg font-bold tracking-tight text-white">
          Chave Pública em QR Code
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Peça para um colega escanear com a câmera para transferir SOL de treino para você!
        </p>

        {/* QR Code Card */}
        <div className="mt-5 p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto">
          <img
            src={qrUrl}
            alt={`QR Code para ${walletAddress}`}
            className="w-48 h-48 block mx-auto object-contain"
            loading="eager"
          />
        </div>

        {/* Endereço e Botão Copiar */}
        <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-xl text-left">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 mb-1">
            <span>Sua Chave Pública ({userName})</span>
            <span className="text-emerald-400">100% Segura</span>
          </div>
          <code className="text-xs text-zinc-200 font-mono break-all block">
            {walletAddress}
          </code>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/20"
          >
            {copied ? '✓ Chave Copiada!' : '📋 Copiar Chave Pública'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>

        <p className="text-[10px] text-zinc-500 font-mono mt-3">
          🛡️ Lembre-se: Chaves públicas podem ser compartilhadas livremente.
        </p>
      </div>
    </div>
  )
}
