import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronLeft, ChevronRight, Circle, Clock } from 'lucide-react'
import { Button } from '@ui/Button'
import type { ActivityEntryPoint } from '@services/engagementService'
import { mondayOf, shiftDate, weekDays, todayIso, groupByDate } from './baWeek'
import { BAScoreLine } from './BAScoreLine'
import './BehavioralActivationPanel.css'

interface Props {
  entries: ActivityEntryPoint[]
  locale: string
}

/**
 * Panneau « Données » de l'activation comportementale pour le praticien :
 * grille hebdomadaire des activités du patient (planifiées / réalisées),
 * navigation semaine par semaine, P/M attendus et ressentis bruts.
 * Restitution neutre conforme MDR : aucune moyenne interprétée, aucun seuil,
 * aucun codage couleur de gravité. Présentationnel : entrées calculées en
 * amont (engagementService), datées par la date métier choisie par le patient.
 */
export function BehavioralActivationPanel({ entries, locale }: Props) {
  const { t } = useTranslation()

  // Semaine affichée : par défaut, celle de la saisie la plus récente.
  const latestDate = useMemo(
    () => entries.reduce((max, e) => (e.date > max ? e.date : max), entries[0]?.date ?? todayIso()),
    [entries],
  )
  const [monday, setMonday] = useState(() => mondayOf(latestDate))

  const goPrevWeek = useCallback(() => setMonday(m => shiftDate(m, -7)), [])
  const goNextWeek = useCallback(() => setMonday(m => shiftDate(m, 7)), [])

  const byDate = useMemo(() => groupByDate(entries), [entries])
  const days = useMemo(() => weekDays(monday), [monday])
  const today = todayIso()

  const weekEntries = useMemo(
    () => days.flatMap(d => byDate.get(d) ?? []),
    [days, byDate],
  )
  const doneCount = weekEntries.filter(e => e.done).length
  const plannedCount = weekEntries.length - doneCount

  const rangeLabel = useMemo(() => {
    const fmt = (iso: string) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    return `${fmt(days[0])} - ${fmt(days[6])}`
  }, [days, locale])

  return (
    <div className="module-data-panel">
      <div className="ba-week__nav">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={16} />}
          aria-label={t('evolution.ba_prev_week')}
          onClick={goPrevWeek}
        />
        <span className="ba-week__range">{rangeLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronRight size={16} />}
          aria-label={t('evolution.ba_next_week')}
          onClick={goNextWeek}
        />
        <span className="ba-week__counts">
          {t('evolution.ba_done_count', { count: doneCount })}
          {' · '}
          {t('evolution.ba_planned_count', { count: plannedCount })}
        </span>
      </div>

      <div className="ba-week__grid">
        {days.map(day => {
          const dayEntries = byDate.get(day) ?? []
          const isToday = day === today
          return (
            <div key={day} className={`ba-week__day ${isToday ? 'ba-week__day--today' : ''}`}>
              <div className="ba-week__day-head">
                {new Date(`${day}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
              </div>
              {dayEntries.map(entry => (
                <div key={entry.id} className={`ba-week__item ${entry.done ? 'ba-week__item--done' : ''}`}>
                  <div className="ba-week__item-head">
                    {entry.done
                      ? <Check size={12} className="ba-week__status ba-week__status--done" aria-label={t('evolution.ba_legend_done')} />
                      : <Circle size={12} className="ba-week__status" aria-label={t('evolution.ba_legend_planned')} />}
                    <span className="ba-week__label">{entry.label}</span>
                  </div>
                  {entry.planned_time && (
                    <span className="ba-week__time"><Clock size={10} /> {entry.planned_time}</span>
                  )}
                  <BAScoreLine
                    caption={t('evolution.ba_expected')}
                    pleasure={entry.expected_pleasure}
                    mastery={entry.expected_mastery}
                  />
                  <BAScoreLine
                    caption={t('evolution.ba_felt')}
                    pleasure={entry.pleasure}
                    mastery={entry.mastery}
                  />
                  {entry.notes && <p className="ba-week__notes">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="ba-week__legend">
        <span className="ba-week__legend-item">
          <Check size={12} className="ba-week__status ba-week__status--done" />
          {t('evolution.ba_legend_done')}
        </span>
        <span className="ba-week__legend-item">
          <Circle size={12} className="ba-week__status" />
          {t('evolution.ba_legend_planned')}
        </span>
        <span className="ba-week__legend-item">{t('evolution.ba_legend_scores')}</span>
      </div>
    </div>
  )
}
