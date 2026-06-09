import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { buildCalendarStatusByDay } from './previewExamples'
import type { PreviewStatus } from './types'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface Props {
  moduleId: string
  t: (key: string, opts?: Record<string, unknown>) => string
  lbl: (key: string) => string
  statuses: PreviewStatus[]
}

// Volet « Calendrier » de l'aperçu : série de jours renseignés + mois passif où
// chaque jour porte la pastille neutre de son statut + légende explicite (MDR).
export function PreviewCalendarPanel({ moduleId, t, lbl, statuses }: Props) {
  const today = new Date()
  const year = today.getFullYear(), month = today.getMonth(), todayDate = today.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7
  const statusByDay = buildCalendarStatusByDay(todayDate, statuses.length)
  const filled = Object.keys(statusByDay).length
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const streakLabel = t(`modules.${moduleId}.streak_plural`, { count: 5 })

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="mt-prev">
      <div className="preview-streak">
        <Flame size={15} className="preview-streak__icon" />
        <span>{streakLabel}</span>
      </div>

      <div className="mt-cal">
        <div className="mt-cal__nav">
          <ChevronLeft size={18} className="mt-cal__chev" />
          <span className="mt-cal__month">{monthLabel}</span>
          <ChevronRight size={18} className="mt-cal__chev mt-cal__chev--off" />
        </div>

        <div className="mt-cal__badge" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
          {filled} / {daysInMonth} {lbl('calendar_days_label')}
        </div>

        <div className="mt-cal__grid">
          {WEEKDAYS.map((d, i) => <span key={i} className="mt-cal__wd">{d}</span>)}
          {cells.map((d, i) => {
            if (d === null) return <span key={i} className="mt-cal__cell" />
            const idx = statusByDay[d]
            const isToday = d === todayDate
            const isFuture = d > todayDate
            if (idx != null) {
              const s = statuses[idx]
              return (
                <span key={i} className="mt-cal__cell">
                  <span
                    className="mt-cal__day mt-cal__day--filled"
                    style={{ background: s.color, ...(isToday ? { outline: '2px solid var(--color-text-primary)' } : {}) }}
                  >
                    {d}
                  </span>
                </span>
              )
            }
            return (
              <span key={i} className="mt-cal__cell">
                <span className={`mt-cal__day mt-cal__day--empty${isFuture ? ' mt-cal__day--future' : ''}`}>{d}</span>
              </span>
            )
          })}
        </div>

        {/* Légende explicite : une entrée par statut */}
        <div className="mt-prev-legend">
          {statuses.map(s => (
            <span key={s.value} className="mt-prev-legend__item">
              <span className="mt-cal__legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
