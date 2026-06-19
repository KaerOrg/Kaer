import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  t: (key: string) => string
}

interface AnchorSpec {
  key: string
  labelCode: string
  color: string
  baseMin: number
}

// Mêmes repères / couleurs que le mobile (chronoMonthUtils.DEFAULT_ANCHORS) →
// aperçu fidèle de ce que voit le patient.
const ANCHORS: readonly AnchorSpec[] = [
  { key: 'wake_time', labelCode: 'modules.chronobiology_tracker.anchor_wake', color: '#F59E0B', baseMin: 420 },
  { key: 'first_meal', labelCode: 'modules.chronobiology_tracker.anchor_first_meal', color: '#F97316', baseMin: 480 },
  { key: 'main_activity', labelCode: 'modules.chronobiology_tracker.anchor_main_activity', color: '#3B82F6', baseMin: 630 },
  { key: 'light', labelCode: 'modules.chronobiology_tracker.anchor_light', color: '#14B8A6', baseMin: 750 },
  { key: 'last_meal', labelCode: 'modules.chronobiology_tracker.anchor_last_meal', color: '#EF4444', baseMin: 1170 },
  { key: 'bedtime', labelCode: 'modules.chronobiology_tracker.anchor_bedtime', color: '#8B5CF6', baseMin: 1380 },
]

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const
const AXIS = ['0h', '6h', '12h', '18h', '24h'] as const

// Variation horaire d'exemple par jour (déterministe, en minutes) → un nuage de
// points réaliste pour la bande de rythme. AUCUNE donnée patient réelle.
const JITTER = [0, 15, -10, 25, -20, 10, 35, -15, 5, -25] as const
const EXAMPLE_DAY_COUNT = 10

function exampleFraction(baseMin: number, dayIdx: number): number {
  const m = ((baseMin + JITTER[dayIdx % JITTER.length]) % 1440 + 1440) % 1440
  return m / 1440
}

// Aperçu praticien du layout 'chrono_month' : reproduit la vue mensuelle mobile
// — calendrier (numéros + pastille des jours saisis) + bande de rythme « strip
// plot » (1 ligne par repère, axe 0-24h, 1 point par jour). Données d'exemple.
export function ChronoMonthLayout({ t }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthLabelRaw = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1)

  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()
  // Jours « saisis » d'exemple : les 10 jours précédant aujourd'hui.
  const loggedDays = new Set<number>()
  for (let i = 0; i < EXAMPLE_DAY_COUNT; i++) {
    const d = today - i
    if (d >= 1) loggedDays.add(d)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="chrono-month">
      <div className="chrono-month__nav">
        <ChevronLeft size={18} className="chrono-month__nav-btn" />
        <span className="chrono-month__month">{monthLabel}</span>
        <ChevronRight size={18} className="chrono-month__nav-btn chrono-month__nav-btn--disabled" />
      </div>

      <div className="chrono-month__weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="chrono-month__weekday">{d}</span>
        ))}
      </div>

      <div className="chrono-month__grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} className="chrono-month__cell chrono-month__cell--empty" />
          const future = d > today
          const logged = loggedDays.has(d)
          return (
            <span key={d} className={`chrono-month__cell${future ? ' chrono-month__cell--future' : ''}`}>
              <span className={`chrono-month__day${d === today ? ' chrono-month__day--today' : ''}`}>{d}</span>
              <span className={`chrono-month__daydot${logged ? ' chrono-month__daydot--filled' : ''}`} />
            </span>
          )
        })}
      </div>

      <div className="chrono-month__band-title">
        {t('modules.chronobiology_tracker.rhythm_band_title')}
      </div>

      <div className="chrono-month__band">
        {ANCHORS.map(a => (
          <div key={a.key} className="chrono-month__band-row">
            <span className="chrono-month__band-label">
              <span className="chrono-month__band-label-dot" style={{ background: a.color }} />
              {t(a.labelCode)}
            </span>
            <span className="chrono-month__band-track">
              {[0.25, 0.5, 0.75].map(f => (
                <span key={f} className="chrono-month__band-grid" style={{ left: `${f * 100}%` }} />
              ))}
              {Array.from({ length: EXAMPLE_DAY_COUNT }).map((_, di) => (
                <span
                  key={di}
                  className="chrono-month__band-dot"
                  style={{ left: `${exampleFraction(a.baseMin, di) * 100}%`, background: a.color }}
                />
              ))}
            </span>
          </div>
        ))}
        <div className="chrono-month__axis-row">
          <span className="chrono-month__band-label" />
          <span className="chrono-month__axis">
            {AXIS.map(l => <span key={l}>{l}</span>)}
          </span>
        </div>
      </div>
    </div>
  )
}
