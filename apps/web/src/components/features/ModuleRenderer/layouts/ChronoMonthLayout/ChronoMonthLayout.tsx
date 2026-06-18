import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  t: (key: string) => string
}

interface AnchorSpec {
  key: string
  labelCode: string
  color: string
}

// Mêmes ancres / couleurs que le mobile (chronoMonthUtils.DEFAULT_ANCHORS) →
// aperçu fidèle de ce que voit le patient.
const ANCHORS: readonly AnchorSpec[] = [
  { key: 'wake_time', labelCode: 'modules.chronobiology_tracker.anchor_wake', color: '#F59E0B' },
  { key: 'first_meal', labelCode: 'modules.chronobiology_tracker.anchor_first_meal', color: '#F97316' },
  { key: 'main_activity', labelCode: 'modules.chronobiology_tracker.anchor_main_activity', color: '#3B82F6' },
  { key: 'last_meal', labelCode: 'modules.chronobiology_tracker.anchor_last_meal', color: '#EF4444' },
  { key: 'bedtime', labelCode: 'modules.chronobiology_tracker.anchor_bedtime', color: '#8B5CF6' },
]

// Jours d'exemple pour la bande de rythme (AUCUNE donnée patient réelle).
const EXAMPLE_DAYS: readonly { label: string; times: Record<string, string> }[] = [
  { label: 'L', times: { wake_time: '07:00', first_meal: '07:45', main_activity: '09:30', last_meal: '19:30', bedtime: '23:00' } },
  { label: 'M', times: { wake_time: '07:20', first_meal: '08:10', main_activity: '10:00', last_meal: '20:00', bedtime: '23:30' } },
  { label: 'M', times: { wake_time: '06:50', first_meal: '07:30', main_activity: '09:00', last_meal: '19:00', bedtime: '22:45' } },
  { label: 'J', times: { wake_time: '07:40', first_meal: '08:30', main_activity: '11:00', last_meal: '20:30', bedtime: '00:10' } },
  { label: 'V', times: { wake_time: '07:10', first_meal: '08:00', main_activity: '09:45', last_meal: '19:45', bedtime: '23:15' } },
]

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

// Densité d'exemple sur 35 cellules (nb d'ancres saisies ce jour-là, 0 = vide).
const DENSITY: readonly number[] = [
  0, 3, 5, 5, 4, 0, 0,
  5, 4, 5, 3, 5, 2, 0,
  4, 5, 5, 5, 4, 0, 1,
  5, 3, 5, 4, 5, 0, 0,
  2, 5, 4, 0, 0, 0, 0,
]

function timeToFraction(time: string): number {
  const [h, m] = time.split(':').map(n => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return Math.max(0, Math.min(1, (h * 60 + m) / 1440))
}

// Aperçu praticien du layout 'chrono_month' : reproduit la vue mensuelle mobile
// (calendrier de densité + bande de rythme positionnant les ancres sur l'axe
// 0-24h + légende). Données d'exemple, pas de fetch — c'est un aperçu.
export function ChronoMonthLayout({ t }: Props) {
  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

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
        {DENSITY.map((count, i) => (
          <span
            key={i}
            className={`chrono-month__cell${count > 0 ? ' chrono-month__cell--filled' : ''}`}
            style={count > 0 ? { opacity: 0.35 + (count / 5) * 0.65 } : undefined}
          />
        ))}
      </div>

      <div className="chrono-month__band-title">
        {t('modules.chronobiology_tracker.rhythm_band_title')}
      </div>

      <div className="chrono-month__band">
        <div className="chrono-month__axis">
          <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
        </div>
        {EXAMPLE_DAYS.map((day, di) => (
          <div key={di} className="chrono-month__band-row">
            <span className="chrono-month__band-day">{day.label}</span>
            <div className="chrono-month__band-track">
              {ANCHORS.map(a => {
                const time = day.times[a.key]
                if (!time) return null
                return (
                  <span
                    key={a.key}
                    className="chrono-month__band-dot"
                    style={{ left: `${timeToFraction(time) * 100}%`, background: a.color }}
                    title={`${t(a.labelCode)} · ${time}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="chrono-month__legend">
        {ANCHORS.map(a => (
          <span key={a.key} className="chrono-month__legend-item">
            <span className="chrono-month__legend-dot" style={{ background: a.color }} />
            {t(a.labelCode)}
          </span>
        ))}
      </div>
    </div>
  )
}
