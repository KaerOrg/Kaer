import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronLeft, ChevronRight, Circle, Clock } from 'lucide-react'
import { Button } from '@ui/Button'
import { TrendChart, type TrendPoint } from '@ui/Chart'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { buildCadenceTrend, type GapSegments } from '../../../lib/chartAggregation'
import type { ActivityEntryPoint } from '@services/engagementService'
import { mondayOf, shiftDate, weekDays, todayIso, groupByDate, dailyFeltMeans } from './baWeek'
import { BA_PLEASURE_COLOR, BA_MASTERY_COLOR } from './clinicalChartConfig'
import { BAScoreLine } from './BAScoreLine'
import './BehavioralActivationPanel.css'

interface Props {
  entries: ActivityEntryPoint[]
  locale: string
  /** Fenêtre des courbes, pilotée par le sélecteur de période de la page (#159). */
  periodDays: number
}

// Cadence d'agrégation (`MODULE_EVOLUTION_CONFIG.behavioral_activation.cadence`) :
// auto-relevé quotidien → moyenne lissée à la semaine par défaut.
const BA_CADENCE = 'weekly'

interface FeltTrend {
  readonly data: TrendPoint[]
  readonly gaps: GapSegments | undefined
}

/**
 * Panneau « Données » de l'activation comportementale pour le praticien :
 * compteurs bruts (réalisées / non réalisées / à venir), courbes des P/A
 * ressentis (moyenne journalière : lecture de l'évolution hédonique et du
 * sentiment d'efficacité par le soignant), puis grille hebdomadaire des
 * activités avec navigation semaine par semaine.
 * Côté praticien, l'agrégation et le codage visuel des métriques sont
 * autorisés (analyse clinique) : aucun seuil ni conclusion automatique.
 * Présentationnel : entrées calculées en amont (engagementService), datées
 * par la date métier choisie par le patient.
 */
export function BehavioralActivationPanel({ entries, locale, periodDays }: Props) {
  const { t } = useTranslation()
  // Courbes P/A : moyenne hebdomadaire + politique des trous par défaut (#159), avec
  // bascule « voir chaque saisie » (une moyenne journalière = un point, sans agrégat).
  const [rawMode, setRawMode] = useState(false)

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

  // Compteurs bruts globaux (toutes semaines confondues).
  const stats = useMemo(() => {
    const doneTotal = entries.filter(e => e.done).length
    const missed = entries.filter(e => !e.done && e.date < today).length
    const upcoming = entries.filter(e => !e.done && e.date >= today).length
    return { doneTotal, missed, upcoming }
  }, [entries, today])

  // Moyennes journalières des ressentis (activités réalisées et notées).
  const feltMeans = useMemo(() => dailyFeltMeans(entries), [entries])

  // Courbe d'une dimension ressentie : agrégée hebdo + trous par défaut, ou brute.
  const buildFeltTrend = useCallback(
    (pick: (f: (typeof feltMeans)[number]) => number | undefined): FeltTrend => {
      const raw: TrendPoint[] = feltMeans.map(f => ({ date: f.date, value: pick(f) ?? null }))
      if (rawMode) return { data: raw, gaps: undefined }
      const agg = buildCadenceTrend(raw, BA_CADENCE, periodDays)
      return { data: agg.data, gaps: agg.gaps }
    },
    [feltMeans, rawMode, periodDays],
  )
  const pleasureTrend = useMemo(() => buildFeltTrend(f => f.pleasure), [buildFeltTrend])
  const masteryTrend = useMemo(() => buildFeltTrend(f => f.mastery), [buildFeltTrend])

  return (
    <div className="module-data-panel">
      <div className="ba-stats">
        <div className="ba-stats__item">
          <span className="ba-stats__value">{stats.doneTotal}</span>
          <span className="ba-stats__label">{t('evolution.ba_stat_done')}</span>
        </div>
        <div className="ba-stats__item">
          <span className="ba-stats__value">{stats.missed}</span>
          <span className="ba-stats__label">{t('evolution.ba_stat_missed')}</span>
        </div>
        <div className="ba-stats__item">
          <span className="ba-stats__value">{stats.upcoming}</span>
          <span className="ba-stats__label">{t('evolution.ba_stat_upcoming')}</span>
        </div>
      </div>

      {feltMeans.length > 0 && (
        <div className="ba-felt">
          <div className="ba-felt__head">
            <h4 className="module-data-panel__chart-title">{t('evolution.ba_curve_title')}</h4>
            <Toggle checked={rawMode} onChange={setRawMode} label={t('evolution.show_each_entry')} />
          </div>
          <div className="ba-felt__chart">
            <span className="ba-felt__metric" style={{ color: BA_PLEASURE_COLOR }}>{t('evolution.ba_curve_pleasure')}</span>
            <TrendChart
              data={pleasureTrend.data}
              gaps={pleasureTrend.gaps}
              unit="/10"
              yDomain={[0, 10]}
              color={BA_PLEASURE_COLOR}
              meanLabel={t('evolution.trend_mean')}
              noDataLabel={t('evolution.no_data_band')}
              locale={locale}
              height={180}
            />
          </div>
          <div className="ba-felt__chart">
            <span className="ba-felt__metric" style={{ color: BA_MASTERY_COLOR }}>{t('evolution.ba_curve_mastery')}</span>
            <TrendChart
              data={masteryTrend.data}
              gaps={masteryTrend.gaps}
              unit="/10"
              yDomain={[0, 10]}
              color={BA_MASTERY_COLOR}
              meanLabel={t('evolution.trend_mean')}
              noDataLabel={t('evolution.no_data_band')}
              locale={locale}
              height={180}
            />
          </div>
        </div>
      )}

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
