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
            xp: currentUser.xp || 100,
            completedActivities: currentUser.completedActivities || 0,
            avatarUrl: currentUser.avatarUrl,
          },
        ])
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [currentUser.xp])

  // Pódio dos 3 primeiros colocados (2º na esquerda, 1º no centro mais alto, 3º na direita)
  const first = leaders[0]
  const second = leaders[1]
  const third = leaders[2]
  const remaining = leaders.slice(3)

  return (
    <div className="w-full">
      {/* Pódio dos 3 Primeiros Colocados */}
      {leaders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end max-w-3xl mx-auto">
          {/* 2º Lugar (Esquerda) */}
          {second ? (
            <div className="flex flex-col items-center justify-end p-5 rounded-2xl bg-gradient-to-b from-slate-800/40 to-[#100f1c]/90 border border-slate-400/25 text-center min-h-[220px] shadow-lg relative order-2 md:order-1">
              <span className="text-2xl mb-2">🥈</span>
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-lg font-bold text-white overflow-hidden shadow-md">
                {second.avatarUrl ? (
                  <img src={second.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  second.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <strong className="text-sm font-semibold mt-3 text-zinc-100 truncate max-w-full px-2">
                {second.name}
              </strong>
              <span className="text-xs font-bold text-emerald-400 mt-1 font-sans">
                {second.xp} XP
              </span>
              <span className="text-[10px] font-semibold text-slate-300 uppercase mt-2 bg-slate-500/20 px-2.5 py-0.5 rounded-full border border-slate-400/30">
                2º Lugar
              </span>
            </div>
          ) : (
            <div className="hidden md:block order-1" />
          )}

          {/* 1º Lugar (Centro - Destaque Taller) */}
          {first && (
            <div className="flex flex-col items-center justify-end p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 via-amber-950/20 to-[#120f24]/95 border-2 border-amber-400/60 text-center min-h-[260px] shadow-2xl shadow-amber-500/10 relative order-1 md:order-2">
              <span className="text-3xl mb-1 animate-bounce">👑</span>
              <div className="w-20 h-20 rounded-full bg-amber-600/30 border-2 border-amber-400 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                {first.avatarUrl ? (
                  <img src={first.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  first.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <strong className="text-base font-bold mt-3 text-amber-200 truncate max-w-full px-2">
                {first.name}
              </strong>
              <span className="text-sm font-extrabold text-emerald-400 mt-1 font-sans">
                {first.xp} XP
              </span>
              <span className="text-[11px] font-bold text-amber-300 uppercase mt-2 bg-amber-500/25 px-3 py-1 rounded-full border border-amber-400/40">
                🥇 1º Lugar
              </span>
            </div>
          )}

          {/* 3º Lugar (Direita) */}
          {third ? (
            <div className="flex flex-col items-center justify-end p-5 rounded-2xl bg-gradient-to-b from-amber-900/30 to-[#100f1c]/90 border border-amber-700/30 text-center min-h-[220px] shadow-lg relative order-3">
              <span className="text-2xl mb-2">🥉</span>
              <div className="w-16 h-16 rounded-full bg-amber-950/60 border-2 border-amber-700 flex items-center justify-center text-lg font-bold text-white overflow-hidden shadow-md">
                {third.avatarUrl ? (
                  <img src={third.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  third.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <strong className="text-sm font-semibold mt-3 text-zinc-100 truncate max-w-full px-2">
                {third.name}
              </strong>
              <span className="text-xs font-bold text-emerald-400 mt-1 font-sans">
                {third.xp} XP
              </span>
              <span className="text-[10px] font-semibold text-amber-400 uppercase mt-2 bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-700/40">
                3º Lugar
              </span>
            </div>
          ) : (
            <div className="hidden md:block order-3" />
          )}
        </div>
      )}

      {/* Lista dos Demais Estudantes */}
      <div className="space-y-2.5 max-w-3xl mx-auto">
        {remaining.length === 0 && leaders.length <= 3 && !loading && (
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-zinc-400 text-xs">
            Participe do Quiz e complete as missões práticas para pontuar e subir de nível no ranking!
          </div>
        )}

        {remaining.map((item) => {
          const isMe = item.id === currentUser.id
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition ${
                isMe
                  ? 'bg-violet-900/35 border-violet-400/60 shadow-md ring-1 ring-violet-500/30'
                  : 'bg-zinc-900/50 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="font-mono text-zinc-400 font-bold w-6 text-center text-xs">
                  #{item.rank}
                </span>
                <div className="w-9 h-9 rounded-full bg-violet-600/25 border border-violet-400/30 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-zinc-100 font-semibold text-sm">{item.name}</strong>
                    {isMe && (
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 font-bold">
                        Você
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">{item.level}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-sans font-bold text-emerald-400 text-sm block">
                  {item.xp} XP
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  {item.completedActivities} {item.completedActivities === 1 ? 'atividade' : 'atividades'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
