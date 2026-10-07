import { useState } from 'react'
import type { PracticeTransaction } from '../types'

interface BlockExplorerModalProps {
  tx: PracticeTransaction | null
  onClose: () => void
}

export function BlockExplorerModal({ tx, onClose }: BlockExplorerModalProps) {
  const [copied, setCopied] = useState(false)

  if (!tx) return null

  // Gera número de bloco / slot pedagógico baseado no timestamp
  const txDate = new Date(tx.timestamp)
  const slotNumber = 284000000 + Math.floor(txDate.getTime() / 1000) % 1000000

  function handleCopySignature() {
    if (tx?.signature) {
      navigator.clipboard.writeText(tx.signature)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isReceive = tx.type === 'receive' || tx.type === 'faucet' || tx.type === 'reward'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-gradient-to-b from-[#18132b] to-[#0c0c16] border border-violet-500/30 rounded-2xl p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-xl">
              🔍
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Explorador de Blocos On-Chain
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Devnet Simulada
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Detalhamento pedagógico da transação (estilo Solscan &amp; Etherscan)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Resumo do Status On-Chain */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-900/70 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              Status da Validação
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
              <strong className="text-sm font-semibold text-emerald-300">
                Finalizado &amp; Confirmado On-Chain
              </strong>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              Slot / Bloco
            </span>
            <code className="text-xs text-violet-300 font-mono font-bold">
              #{slotNumber.toLocaleString('pt-BR')}
            </code>
          </div>
        </div>

        {/* Informações On-Chain */}
        <div className="mt-4 space-y-3">
          {/* Assinatura / Hash */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span className="font-mono text-[10px] uppercase">Assinatura da Transação (Hash TXID)</span>
              <button
                type="button"
                onClick={handleCopySignature}
                className="text-[11px] text-violet-300 hover:text-white px-2 py-0.5 rounded bg-violet-600/20 border border-violet-400/30 hover:bg-violet-600/40 transition"
              >
                {copied ? '✓ Copiado!' : 'Copiar Hash'}
              </button>
            </div>
            <code className="text-xs text-zinc-300 font-mono break-all block selection:bg-violet-700">
              {tx.signature}
            </code>
          </div>

          {/* Grid de Detalhes */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Tipo da Operação
              </span>
              <span className={`font-semibold capitalize ${isReceive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tx.type === 'faucet' && '💧 Torneira Devnet (Airdrop)'}
                {tx.type === 'send' && '↗️ Transferência Enviada'}
                {tx.type === 'receive' && '↙️ Transferência Recebida'}
                {tx.type === 'reward' && '🏆 Recompensa Educacional'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Valor Transacionado
              </span>
              <span className={`font-mono font-bold text-sm ${isReceive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isReceive ? '+' : '-'}{tx.amount} SOL
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Taxa de Rede (Gas Fee)
              </span>
              <span className="font-mono text-zinc-300">
                {tx.fee ? `${tx.fee} SOL (~5.000 lamports)` : '0.000000 SOL (Isento)'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Data &amp; Hora
              </span>
              <span className="text-zinc-300 font-mono">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                }).format(txDate)}
              </span>
            </div>
          </div>

          {/* Origem / Destino */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
              Endereço / Identificador da Contraparte
            </span>
            <code className="text-xs text-zinc-200 font-mono break-all block">
              {tx.toOrFrom}
            </code>
          </div>
        </div>

        {/* Seção Educacional: O que significa cada dado? */}
        <div className="mt-5 p-4 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs text-zinc-300">
          <strong className="text-violet-300 flex items-center gap-1.5 font-semibold mb-2">
            💡 Como ler um Explorador de Blocos Real (Web3 101):
          </strong>
          <ul className="space-y-1.5 list-disc list-inside text-zinc-400">
            <li>
              <strong className="text-zinc-200">Hash (Assinatura):</strong> A impressão digital única da transação. Ninguém pode alterar ou falsificar.
            </li>
            <li>
              <strong className="text-zinc-200">Bloco (Slot):</strong> O "pacote" gravado e encadeado criptograficamente com as transações anteriores na rede.
            </li>
            <li>
              <strong className="text-zinc-200">Taxa de Rede (Fee):</strong> Paga aos validadores (computadores) que processaram e registraram sua operação com segurança.
            </li>
          </ul>
        </div>

        {/* Rodapé */}
        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition"
          >
            Fechar Explorador
          </button>
        </div>
      </div>
    </div>
  )
}
