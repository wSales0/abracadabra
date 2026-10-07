import { useEffect, useState } from 'react'
import type { LeaderboardUser, UserProfile } from '../types'
import { fetchLeaderboardFromMongo } from '../lib/mongoDbService'

interface LeaderboardWidgetProps {
  currentUser: UserProfile
}

export function LeaderboardWidget({ currentUser }: LeaderboardWidgetProps) {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  async function loadLeaderboard() {
    setLoading(true)
    try {
      const data = await fetchLeaderboardFromMongo()
      if (data && data.length > 0) {
        setLeaders(data)
      } else {
        // Fallback dinâmico com o usuário atual se a lista do banco ainda estiver vazia
        setLeaders([
          {
            rank: 1,
            id: currentUser.id,
            name: currentUser.displayName || 'Você',
            level: currentUser.level || 'Explorador',
            xp: currentUser.xp || 120,
            completedActivities: currentUser.completedActivities || 1,
            avatarUrl: currentUser.avatarUrl,
          },
        ])
      }
    } catch {
      // Ignora erro de rede em caso offline
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [currentUser.xp])

  // Pódio dos 3 primeiros colocados
  const topThree = leaders.slice(0, 3)
  const remaining = leaders.slice(3)

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-b from-[#18122c]/90 to-[#0e0d19]/90 p-6 shadow-xl backdrop-blur-sm text-white">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            🏆
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Ranking Geral da Turma
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Ao Vivo
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Alunos mais dedicados ordenados por XP e missões concluídas
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadLeaderboard}
          disabled={loading}
          className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Atualizar ranking agora"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
          <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      </div>

      {/* Pódio (Top 3) */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 my-6 items-end">
          {/* 2º Lugar */}
          {topThree[1] && (
            <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900/60 border border-slate-400/20 text-center relative order-1">
              <span className="text-xl mb-1">🥈</span>
              <div className="w-11 h-11 rounded-full bg-slate-700/60 border-2 border-slate-300 flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-md">
                {topThree[1].avatarUrl ? (
                  <img src={topThree[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  topThree[1].name.slice(0, 1)
                )}
              </div>
              <strong className="text-xs font-semibold mt-2 text-zinc-200 truncate max-w-full">
                {topThree[1].name}
              </strong>
              <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
                {topThree[1].xp} XP
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5">2º Lugar</span>
            </div>
          )}

          {/* 1º Lugar (Centro com destaque) */}
          {topThree[0] && (
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-amber-500/15 to-zinc-900/80 border-2 border-amber-400/50 text-center relative order-0 md:order-1 shadow-lg shadow-amber-500/10">
              <span className="text-2xl mb-1 animate-bounce">👑</span>
              <div className="w-14 h-14 rounded-full bg-amber-600/40 border-2 border-amber-400 flex items-center justify-center text-lg font-bold text-white overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                {topThree[0].avatarUrl ? (
                  <img src={topThree[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  topThree[0].name.slice(0, 1)
                )}
              </div>
              <strong className="text-xs font-bold mt-2 text-amber-200 truncate max-w-full">
                {topThree[0].name}
              </strong>
              <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {topThree[0].xp} XP
              </span>
              <span className="text-[9px] font-semibold text-amber-300 uppercase mt-0.5 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                1º Lugar
              </span>
            </div>
          )}

          {/* 3º Lugar */}
          {topThree[2] && (
            <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900/60 border border-amber-800/30 text-center relative order-2">
              <span className="text-xl mb-1">🥉</span>
              <div className="w-11 h-11 rounded-full bg-amber-950/60 border-2 border-amber-700 flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-md">
                {topThree[2].avatarUrl ? (
                  <img src={topThree[2].avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  topThree[2].name.slice(0, 1)
                )}
              </div>
              <strong className="text-xs font-semibold mt-2 text-zinc-200 truncate max-w-full">
                {topThree[2].name}
              </strong>
              <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
                {topThree[2].xp} XP
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5">3º Lugar</span>
            </div>
          )}
        </div>
      )}

      {/* Lista dos demais alunos */}
      <div className="space-y-2 mt-4">
        {remaining.map((item) => {
          const isMe = item.id === currentUser.id
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                isMe
                  ? 'bg-violet-900/30 border-violet-400/50 shadow-sm'
                  : 'bg-zinc-950/40 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-400 font-bold w-5 text-center">
                  #{item.rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-400/30 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.name.slice(0, 1)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-zinc-100 font-semibold">{item.name}</strong>
                    {isMe && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-violet-500/30 text-violet-300">
                        Você
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block">{item.level}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-emerald-400 block">
                  {item.xp} XP
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">
                  {item.completedActivities} atividades
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
