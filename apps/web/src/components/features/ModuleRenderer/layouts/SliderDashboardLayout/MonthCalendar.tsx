import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  accent: string
  moduleId: string
  t: (key: string) => string
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Heatmap calendrier (aperçu praticien) : intensité moyenne mock par jour, plus
// le cercle est foncé plus la valeur est élevée. Aucun jugement clinique — la
// couleur encode uniquement l'amplitude brute (conformité MDR 2017/745).
export function MonthCalendar({ accent, moduleId, t }: Props) {
  const today = new Date()
  const year = today.getFullYear(), month = today.getMonth()
  const todayDate = today.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7

  const dayAvg: Record<number, number> = {}
  let filled = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const base = 3 + ((d - 1) / (daysInMonth - 1)) * 6
    const wiggle = (((d * 7) % 3) - 1) * 0.5
    dayAvg[d] = Math.max(1, Math.min(10, Math.round(base + wiggle)))
    filled++
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="mt-cal">
      <div className="mt-cal__nav">
        <ChevronLeft size={18} className="mt-cal__chev" />
        <span className="mt-cal__month">{monthLabel}</span>
        <ChevronRight size={18} className="mt-cal__chev mt-cal__chev--off" />
      </div>
      <div className="mt-cal__badge" style={{ borderColor: accent, color: accent }}>
        {filled} / {daysInMonth} {t(`modules.${moduleId}.month_days_label`)}
      </div>
      <div className="mt-cal__grid">
        {WEEKDAYS.map((d, i) => <span key={i} className="mt-cal__wd">{d}</span>)}
        {weeks.flat().map((d, i) => {
          if (d === null) return <span key={i} className="mt-cal__cell" />
          const avg = dayAvg[d]
          const isToday = d === todayDate
          const isFuture = d > todayDate
          // Aperçu praticien : on remplit le mois COMPLET (y compris les jours à venir)
          // pour illustrer le dégradé d'intensité des couleurs sur toute la grille.
          if (avg != null) {
            const opacity = 0.25 + 0.75 * ((avg - 1) / 9)
            return (
              <span key={i} className="mt-cal__cell">
                <span className="mt-cal__day mt-cal__day--filled"
                  style={{ background: accent, opacity, ...(isToday ? { outline: '2px solid #111827' } : {}) }}>
                  {d}
                </span>
              </span>
            )
          }
          return (
            <span key={i} className="mt-cal__cell">
              <span className={`mt-cal__day mt-cal__day--empty${isFuture ? ' mt-cal__day--future' : ''}`}
                style={isToday ? { borderColor: accent, borderWidth: 2 } : undefined}>
                {d}
              </span>
            </span>
          )
        })}
      </div>
      <div className="mt-cal__legend">
        <span className="mt-cal__legend-dot" style={{ background: accent }} />
        {t(`modules.${moduleId}.month_legend`)}
      </div>
    </div>
  )
}
