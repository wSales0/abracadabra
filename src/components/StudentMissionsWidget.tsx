import { useState } from 'react'
import { STUDENT_MISSIONS, type StudentMission } from '../lib/missionsEngine'

interface StudentMissionsWidgetProps {
  completedMissions: string[]
  onNavigateTab: (tab: 'home' | 'wallet' | 'activities' | 'profile') => void
}

export function StudentMissionsWidget({ completedMissions, onNavigateTab }: StudentMissionsWidgetProps) {
  const [expanded, setExpanded] = useState(true)

  const total = STUDENT_MISSIONS.length
  const completedCount = completedMissions.length
  const percentage = Math.round((completedCount / total) * 100)

  return (
    <aside className="missions-widget" aria-label="Trilha de Missões do Aluno">
      <div className="missions-header">
        <div className="missions-header-left">
          <div className="missions-orb">🎯</div>
          <div>
            <div className="missions-title-row">
              <h3>Trilha do Aprendiz: Primeiros Passos em Web3</h3>
              <span className="missions-badge-safe">🛡️ 100% Simulado e Seguro</span>
            </div>
            <p className="missions-subtitle">
              Missões guiadas com explicações simples para jovens e idosos aprenderem sem medo.
            </p>
          </div>
        </div>

        <div className="missions-header-right">
          <div className="missions-progress-wrap">
            <span className="missions-progress-text">
              <strong>{completedCount} de {total}</strong> concluídas ({percentage}%)
            </span>
            <div className="missions-bar-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
              <div className="missions-bar-fill" style={{ width: `${percentage}%` }} />
            </div>
          </div>
          <button
            type="button"
            className="missions-toggle-btn"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? '▲ Ocultar' : '▼ Ver Missões'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="missions-list">
          {STUDENT_MISSIONS.map((mission, index) => {
            const isDone = completedMissions.includes(mission.id)

            return (
              <div key={mission.id} className={`mission-item ${isDone ? 'done' : 'pending'}`}>
                <div className="mission-status-icon">
                  {isDone ? (
                    <span className="check-done" title="Missão concluída!">✓</span>
                  ) : (
                    <span className="num-pending">{index + 1}</span>
                  )}
                </div>

                <div className="mission-info">
                  <div className="mission-title-line">
                    <h4>{mission.title}</h4>
                    <span className="mission-tag-analogy">💡 {mission.shortLabel}</span>
                  </div>
                  <p>{mission.description}</p>
                  <small className="mission-analogy-text">{mission.analogy}</small>
                </div>

                <div className="mission-actions">
                  <span className="mission-reward">
                    +{mission.xpReward} XP &amp; +{mission.solReward.toFixed(2)} SOL
                  </span>
                  {isDone ? (
                    <span className="badge-completed">Concluída ✨</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-start-mission"
                      onClick={() => onNavigateTab(mission.tabDestination)}
                    >
                      Fazer agora →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {completedCount === total && (
        <div className="all-missions-celebration">
          <span>🏆</span>
          <div>
            <strong>Parabéns! Você completou toda a Trilha do Aprendiz!</strong>
            <p>Você já domina o que é chave pública, torneira de teste, transferências e segurança contra golpes.</p>
          </div>
        </div>
      )}
    </aside>
  )
}
