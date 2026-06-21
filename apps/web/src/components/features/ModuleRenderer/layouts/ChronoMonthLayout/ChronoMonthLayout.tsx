import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildRhythmogram, minutesToClock, type RhythmEntry } from '@psytool/shared'
import { CHRONO_ANCHOR_KEYS, buildRhythmogramAnchors } from '../../../../../lib/chronoAnchors'
import { ChronoRhythmogram } from '../../../ChronoRhythmogram'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

// Heure de base d'exemple par repère (minutes depuis minuit) + variation
// déterministe par jour → un rythmogramme réaliste pour l'aperçu praticien.
// AUCUNE donnée patient réelle.
const EXAMPLE_BASE: Record<string, number> = {
  wake_time: 420,
  first_meal: 480,
  main_activity: 630,
  light: 750,
  last_meal: 1170,
  bedtime: 1380,
}
const JITTER = [0, 15, -10, 25, -20, 10, 35, -15, 5, -25, 20, -8] as const
const EXAMPLE_DAY_COUNT = 12

// Aperçu praticien du layout 'chrono_month' : reproduit fidèlement la vue
// mensuelle mobile — calendrier (numéros + pastille des jours saisis) +
// rythmogramme (heure de chaque repère jour par jour). Données d'exemple.
export function ChronoMonthLayout() {
  const { t, i18n } = useTranslation()

  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const month1 = month + 1
  const today = now.getDate()

  const monthLabelRaw = now.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1)

  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month1, 0).getDate()

  // Jours « saisis » d'exemple : les 12 jours précédant aujourd'hui.
  const { loggedDays, entries } = useMemo(() => {
    const logged = new Set<number>()
    const ex: RhythmEntry[] = []
    for (let i = 0; i < EXAMPLE_DAY_COUNT; i++) {
      const d = today - i
      if (d < 1) break
      logged.add(d)
      const values: Record<string, string> = {}
      for (const key of CHRONO_ANCHOR_KEYS) {
        values[key] = minutesToClock(EXAMPLE_BASE[key] + JITTER[i % JITTER.length])
      }
      ex.push({ date: `${year}-${String(month1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, values })
    }
    return { loggedDays: logged, entries: ex }
  }, [today, year, month1])

  const result = useMemo(() => buildRhythmogram(entries, CHRONO_ANCHOR_KEYS, year, month1), [entries, year, month1])
  const anchors = useMemo(() => buildRhythmogramAnchors(result.anchors, t), [result.anchors, t])

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

      <ChronoRhythmogram
        data={result.data}
        anchors={anchors}
        yDomain={result.yDomain}
        weekStarts={result.weekStarts}
        year={year}
        month={month1}
        locale={i18n.language}
        xAxisLabel={t('modules.chronobiology_tracker.axis_day')}
        yAxisLabel={t('modules.chronobiology_tracker.axis_time')}
      />
    </div>
  )
}
