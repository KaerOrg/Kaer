import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildMonthDays, monthsWithSessions, previousMonth, sessionsInMonth, sessionsInWeekFrom,
  tallyFeelings, mondayOf, shiftDate,
  type BreathingSessionRow, type BreathingTechniqueSpec, type YearMonth,
} from '@kaer/shared'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { MonthGrid, type MonthGridCell } from '@ui/MonthGrid'
import { FEELING_COLORS, FEELING_SEGMENTS } from './breathingDataConfig'
import { BreathingFeelingBar } from './BreathingFeelingBar'
import './BreathingEvolutionPanel.css'

interface Props {
  sessions: readonly BreathingSessionRow[]
  /** Techniques déclarées en config : source des couleurs et de l'ordre. */
  techniques: readonly BreathingTechniqueSpec[]
  /** Objectif hebdomadaire réglé par le patient, `null` s'il n'en a pas fixé. */
  weeklyGoal: number | null
  locale: string
  /** Date du jour, injectée pour que le rendu reste testable. */
  todayIsoDate: string
}

/** Teinte d'un jour sans session : une absence de donnée, pas un manquement. */
const NO_SESSION_COLOR = '#F3F4F6'

/** Rang absolu d'un mois, pour comparer deux mois sans se soucier du passage d'année. */
function rank({ year, month }: YearMonth): number {
  return year * 12 + month
}

/**
 * Section « respiration » de la page Évolution clinique : un calendrier du mois et
 * trois tuiles de comptes.
 *
 * MDR 2017/745, à lire avant de toucher à ce fichier. La couleur d'un carré code
 * l'**identité** de la technique pratiquée ce jour-là, jamais une qualité de journée ;
 * le point porte le ressenti déclaré, tel quel. Le rapprochement au mois précédent est
 * l'affichage de **deux comptes bruts côte à côte** : ni flèche, ni pourcentage
 * d'évolution, ni couleur de progression, et rien ici ne conclut qu'un mois vaut mieux
 * qu'un autre.
 */
export function BreathingEvolutionPanel({
  sessions, techniques, weeklyGoal, locale, todayIsoDate,
}: Props) {
  const { t } = useTranslation()

  const currentMonth = useMemo<YearMonth>(() => ({
    year: Number(todayIsoDate.slice(0, 4)),
    month: Number(todayIsoDate.slice(5, 7)),
  }), [todayIsoDate])

  // Bornes de navigation : on ne remonte pas avant la première session (il n'y aurait
  // rien à voir) et on ne dépasse pas le mois courant (il n'existe pas encore).
  const firstMonth = useMemo(() => monthsWithSessions(sessions)[0] ?? currentMonth, [sessions, currentMonth])
  const lastMonthWithData = useMemo(() => {
    const months = monthsWithSessions(sessions)
    return months[months.length - 1] ?? currentMonth
  }, [sessions, currentMonth])

  const [shown, setShown] = useState<YearMonth>(lastMonthWithData)
  // Comparaison par rang plutôt que par égalité : si les sessions changent sous le
  // composant, un mois affiché sorti des bornes reste borné au lieu de laisser la
  // navigation filer indéfiniment.
  const atFirst = rank(shown) <= rank(firstMonth)
  const atCurrent = rank(shown) >= rank(currentMonth)

  const goPrev = useCallback(() => setShown(previousMonth), [])
  const goNext = useCallback(
    () => setShown(month => (month.month === 12 ? { year: month.year + 1, month: 1 } : { year: month.year, month: month.month + 1 })),
    [],
  )

  const monthLabel = useMemo(() => {
    const raw = new Date(shown.year, shown.month - 1, 1)
      .toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [shown, locale])

  const colorOf = useMemo(() => {
    const byKey = new Map(techniques.map(technique => [technique.key, technique.color]))
    return (key: string) => byKey.get(key) ?? NO_SESSION_COLOR
  }, [techniques])

  const days = useMemo(() => buildMonthDays(sessions, shown), [sessions, shown])

  const cells = useMemo<MonthGridCell[]>(() => days.map(day => ({
    day: day.day,
    background: colorOf(day.techniqueKey),
    dotColor: day.feeling == null ? undefined : FEELING_COLORS[day.feeling],
    label: t('evolution.breathing_day_label', {
      count: day.sessions,
      technique: t(`modules.breathing_techniques.${day.techniqueKey}_name`),
    }),
  })), [days, colorOf, t])

  const monthSessions = useMemo(() => sessionsInMonth(sessions, shown), [sessions, shown])
  const prevMonthCount = useMemo(
    () => sessionsInMonth(sessions, previousMonth(shown)).length,
    [sessions, shown],
  )

  const weekCount = useMemo(() => {
    const monday = mondayOf(todayIsoDate)
    return sessionsInWeekFrom(sessions, monday, shiftDate(monday, 6))
  }, [sessions, todayIsoDate])

  const tally = useMemo(() => tallyFeelings(monthSessions), [monthSessions])
  const answered = tally.calmer + tally.same + tally.tenser

  // Techniques réellement pratiquées ce mois, dans l'ordre de la config : la légende
  // ne liste que ce que le calendrier montre.
  const monthTechniques = useMemo(() => {
    const used = new Set(days.map(day => day.techniqueKey))
    return techniques.filter(technique => used.has(technique.key))
  }, [days, techniques])

  return (
    <div className="module-data-panel breathing-evolution">
      <div className="breathing-evolution__layout">
        <div className="breathing-evolution__calendar">
          <div className="breathing-evolution__nav">
            <Button
              variant="ghost" size="xs" icon={<ChevronLeft size={18} />}
              aria-label={t('common.previous')} disabled={atFirst} onClick={goPrev}
            />
            <span className="breathing-evolution__month">{monthLabel}</span>
            <Button
              variant="ghost" size="xs" icon={<ChevronRight size={18} />}
              aria-label={t('common.next')} disabled={atCurrent} onClick={goNext}
            />
          </div>

          <MonthGrid
            year={shown.year} month={shown.month} locale={locale} cells={cells}
            dimAfter={todayIsoDate} data-testid="breathing-evolution-calendar"
          />

          <div className="breathing-evolution__legend">
            {monthTechniques.map(technique => (
              <span key={technique.key} className="breathing-evolution__legend-item">
                <span className="breathing-evolution__legend-square" style={{ background: technique.color }} />
                {t(`modules.breathing_techniques.${technique.key}_name`)}
              </span>
            ))}
            <span className="breathing-evolution__legend-item">
              <span className="breathing-evolution__legend-square" style={{ background: NO_SESSION_COLOR }} />
              {t('evolution.breathing_legend_no_session')}
            </span>
            {FEELING_SEGMENTS.map(segment => (
              <span key={segment.key} className="breathing-evolution__legend-item">
                <span className="breathing-evolution__legend-dot" style={{ background: segment.color }} />
                {t(`patient.breathing_feeling_${segment.key}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="breathing-evolution__side">
          <Card variant="outlined">
            <p className="breathing-evolution__value" data-testid="breathing-month-count">
              {monthSessions.length}
            </p>
            <p className="breathing-evolution__label">{t('evolution.breathing_month_sessions')}</p>
            <p className="breathing-evolution__note">
              {t('evolution.breathing_prev_month_sessions', { count: prevMonthCount })}
            </p>
          </Card>

          <Card variant="outlined">
            <p className="breathing-evolution__value" data-testid="breathing-week-count">
              {weeklyGoal == null ? weekCount : `${weekCount}/${weeklyGoal}`}
            </p>
            <p className="breathing-evolution__label">{t('evolution.breathing_week_sessions')}</p>
            <p className="breathing-evolution__note">
              {weeklyGoal == null
                ? t('evolution.breathing_week_no_goal')
                : t('evolution.breathing_week_goal')}
            </p>
          </Card>

          <Card variant="outlined">
            <p className="breathing-evolution__label">{t('evolution.breathing_feeling_title')}</p>
            <BreathingFeelingBar tally={tally} />
            <p className="breathing-evolution__note">
              {t('evolution.breathing_feeling_answered', { answered, total: tally.total })}
            </p>
          </Card>
        </div>
      </div>

      <p className="evolution-card__mention">{t('evolution.breathing_mention')}</p>
    </div>
  )
}
