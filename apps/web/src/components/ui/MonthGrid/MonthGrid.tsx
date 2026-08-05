import { useMemo } from 'react'
import './MonthGrid.css'

/** Ce qu'un jour rempli affiche. Aucun métier : l'appelant fournit ses teintes. */
export interface MonthGridCell {
  /** Jour du mois, 1 à 31. */
  day: number
  /** Fond du carré. */
  background: string
  /** Point sous le carré, absent si le jour n'en porte pas. */
  dotColor?: string
  /** Libellé accessible du jour (titre au survol + lecteurs d'écran). */
  label?: string
}

interface Props {
  year: number
  /** Mois de 1 à 12, pas l'index JavaScript. */
  month: number
  /** Locale des initiales de jours. */
  locale: string
  /** Jours remplis, dans n'importe quel ordre. Les autres jours restent vides. */
  cells: readonly MonthGridCell[]
  /** Jours postérieurs à cette date `YYYY-MM-DD` rendus estompés. Absent = aucun. */
  dimAfter?: string
  'data-testid'?: string
}

/**
 * Grille calendaire d'un mois, du lundi au dimanche.
 *
 * Purement présentationnel : la grille ne sait rien du domaine, elle place des
 * carrés et des points aux teintes qu'on lui donne. C'est l'appelant qui décide ce
 * qu'une couleur signifie.
 *
 * Le décalage de tête est calculé en `(getDay() + 6) % 7` pour que la semaine
 * commence un lundi, et les initiales de jours viennent d'`Intl` : elles suivent la
 * locale au lieu d'être figées en français.
 */
export function MonthGrid({ year, month, locale, cells, dimAfter, ...rest }: Props) {
  const weekdays = useMemo(() => weekdayInitials(locale), [locale])
  const byDay = useMemo(() => new Map(cells.map(cell => [cell.day, cell])), [cells])

  const days = useMemo(() => {
    // Le 1er du mois est à l'index 0 en JS, d'où `month - 1`.
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const count = new Date(year, month, 0).getDate()
    const slots: (number | null)[] = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= count; day++) slots.push(day)
    while (slots.length % 7 !== 0) slots.push(null)
    return slots
  }, [year, month])

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

  return (
    <div className="month-grid" data-testid={rest['data-testid']}>
      <div className="month-grid__weekdays">
        {weekdays.map((initial, index) => (
          <span key={index} className="month-grid__weekday">{initial}</span>
        ))}
      </div>
      <div className="month-grid__days">
        {days.map((day, index) => {
          if (day == null) return <span key={`empty-${index}`} className="month-grid__slot" />
          const cell = byDay.get(day)
          const iso = `${monthPrefix}-${String(day).padStart(2, '0')}`
          const dimmed = dimAfter != null && iso > dimAfter
          return (
            <span key={day} className="month-grid__slot">
              <span
                className={`month-grid__day${dimmed ? ' month-grid__day--dimmed' : ''}`}
                style={cell ? { background: cell.background } : undefined}
                title={cell?.label}
                aria-label={cell?.label}
              >
                {day}
              </span>
              {cell?.dotColor != null && (
                <span className="month-grid__dot" style={{ background: cell.dotColor }} />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Initiales des sept jours, lundi en tête, selon la locale. */
function weekdayInitials(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' })
  // 2024-01-01 est un lundi : sept jours consécutifs à partir de là donnent la semaine.
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 1 + index))))
}
