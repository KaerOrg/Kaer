import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { SleepPoint } from '@services/engagementService'
import { ProgressRing } from '@ui/ProgressRing'
import { Chip } from '@ui/Chip'
import { TrendChart, type TrendPoint, computeTrendMean, formatTrendValue } from '@ui/Chart'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { buildCadenceTrend } from '../../../lib/chartAggregation'
import { barGeometry, formatMinutes, avg } from './sleepGrid'
import { SLEEP_METRICS, metricDomain, type SleepMetricKey } from './sleepMetrics'
import { MetricChip } from './MetricChip'
import './SleepDataPanel.css'

interface Props {
  points: SleepPoint[]
  locale: string
  /** Fenêtre de la courbe, pilotée par le sélecteur de période de la page (#159). */
  periodDays: number
  /**
   * Période de référence optionnelle (page Évolution) : nuits déjà re-datées sur
   * l'axe courant. Superpose une courbe de comparaison + un delta chiffré.
   */
  comparison?: { points: SleepPoint[]; label: string }
}

// Cadence d'agrégation du sommeil (`MODULE_EVOLUTION_CONFIG.sleep_diary.cadence`) :
// le sommeil est un auto-relevé quotidien → moyenne lissée à la semaine par défaut.
const SLEEP_CADENCE = 'weekly'

// Repères horaires de l'axe noon→noon (toutes les 6 h).
const AXIS_TICKS = [
  { pos: 0, label: '12h' },
  { pos: 25, label: '18h' },
  { pos: 50, label: '0h' },
  { pos: 75, label: '6h' },
  { pos: 100, label: '12h' },
] as const

/**
 * Panneau « Données » de l'agenda du sommeil pour le praticien : bandeau à la une
 * (anneau d'efficacité + durée + endormissement), stats secondaires en puces,
 * grille agenda 24 h, et graphe de tendance précis piloté par un sélecteur de
 * métrique. Présentationnel : points calculés en amont (engagementService).
 * Côté praticien, le codage visuel des métriques est autorisé (analyse soignant) ;
 * les valeurs restent brutes, sans seuil de jugement automatique.
 */
export function SleepDataPanel({ points, locale, periodDays, comparison }: Props) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<SleepMetricKey>('efficiency')
  const handleSelectMetric = useCallback((key: SleepMetricKey) => setMetric(key), [])
  // Courbe : moyenne hebdomadaire + politique des trous par défaut (#159), avec
  // bascule « voir chaque saisie » (une nuit = un point, sans agrégat ni bande).
  const [rawMode, setRawMode] = useState(false)

  const stats = useMemo(() => {
    const eff = points.map(p => p.efficiency).filter((v): v is number => v != null)
    const tst = points.map(p => p.total_sleep_min).filter((v): v is number => v != null)
    return {
      avgEfficiency: avg(eff),
      avgSleep: avg(tst),
      avgOnset: avg(points.map(p => p.onset_min)),
      avgWaso: avg(points.map(p => p.waso_min)),
      nights: points.length,
      nightmares: points.filter(p => p.nightmares).length,
    }
  }, [points])

  const activeMetric = useMemo(() => SLEEP_METRICS.find(m => m.key === metric) ?? SLEEP_METRICS[0], [metric])

  // Saisies brutes (une nuit = un point). Base des stats et du delta (N = nuits
  // renseignées) ; l'agrégation ne sert qu'au tracé de la courbe.
  const rawTrend = useMemo<TrendPoint[]>(
    () => points.map(p => ({
      date: p.date,
      value: activeMetric.value(p),
      event: activeMetric.markNightmares && p.nightmares,
    })),
    [points, activeMetric],
  )
  const rawComparison = useMemo<TrendPoint[] | null>(
    () => comparison ? comparison.points.map(p => ({ date: p.date, value: activeMetric.value(p) })) : null,
    [comparison, activeMetric],
  )
  const trendDomain = useMemo(() => metricDomain(activeMetric, points), [activeMetric, points])

  // Courbe : moyenne hebdomadaire + trous (pont/bande) par défaut, ou points bruts.
  const aggregated = useMemo(
    () => rawMode ? null : buildCadenceTrend(rawTrend, SLEEP_CADENCE, periodDays),
    [rawMode, rawTrend, periodDays],
  )
  const trendData = aggregated ? aggregated.data : rawTrend
  const gaps = aggregated?.gaps
  const comparisonTrend = useMemo<TrendPoint[] | null>(() => {
    if (!rawComparison) return null
    return rawMode ? rawComparison : buildCadenceTrend(rawComparison, SLEEP_CADENCE, periodDays).data
  }, [rawComparison, rawMode, periodDays])

  // Delta : écart des moyennes BRUTES (indépendant du lissage de la courbe).
  const delta = useMemo(() => {
    if (!rawComparison) return null
    const main = computeTrendMean(rawTrend)
    const ref = computeTrendMean(rawComparison)
    return main != null && ref != null ? Math.round((main - ref) * 10) / 10 : null
  }, [rawComparison, rawTrend])

  // Grille : nuits les plus récentes en premier, plafonnées à 21 pour la lisibilité.
  const gridNights = useMemo(() => points.slice(-21).reverse(), [points])

  return (
    <div className="module-data-panel">
      {/* Bandeau à la une : anneau d'efficacité + durée + endormissement ─── */}
      <div className="sleep-hero">
        <ProgressRing
          value={stats.avgEfficiency ?? 0}
          size={104}
          strokeWidth={11}
          label={stats.avgEfficiency != null ? `${stats.avgEfficiency} %` : '-'}
          sublabel={t('evolution.sleep_avg_efficiency')}
          ariaLabel={t('evolution.sleep_avg_efficiency')}
        />
        <div className="sleep-hero__facts">
          <div className="sleep-hero__fact">
            <span className="sleep-hero__value">{stats.avgSleep != null ? formatMinutes(stats.avgSleep) : '-'}</span>
            <span className="sleep-hero__label">{t('evolution.sleep_avg_duration')}</span>
          </div>
          <div className="sleep-hero__fact">
            <span className="sleep-hero__value">{stats.avgOnset != null ? formatMinutes(stats.avgOnset) : '-'}</span>
            <span className="sleep-hero__label">{t('evolution.sleep_avg_onset')}</span>
          </div>
        </div>
      </div>

      {/* Stats secondaires en puces compactes ─────────────────────────────── */}
      <div className="sleep-secondary">
        <Chip size="sm" label={`${t('evolution.sleep_avg_waso')} · ${stats.avgWaso != null ? formatMinutes(stats.avgWaso) : '-'}`} />
        <Chip size="sm" label={`${t('evolution.sleep_nights')} · ${stats.nights}`} />
        <Chip size="sm" label={`${t('evolution.sleep_nightmares')} · ${stats.nightmares}`} />
      </div>

      {/* Grille agenda du sommeil (24 h) ──────────────────────────────────── */}
      <div className="sleep-grid">
        <div className="sleep-grid__header">
          <h4 className="module-data-panel__chart-title">{t('evolution.sleep_grid_title')}</h4>
        </div>
        <div className="sleep-grid__axis">
          {AXIS_TICKS.map(tick => (
            <span key={tick.pos} className="sleep-grid__tick" style={{ left: `${tick.pos}%` }}>{tick.label}</span>
          ))}
        </div>
        <ul className="sleep-grid__rows">
          {gridNights.map(night => {
            const inBed = night.in_bed_time && night.out_of_bed_time
              ? barGeometry(night.in_bed_time, night.out_of_bed_time)
              : null
            const asleep = night.bedtime && night.wake_time
              ? barGeometry(night.bedtime, night.wake_time)
              : null
            return (
              <li key={night.date} className="sleep-grid__row">
                <span className="sleep-grid__date">
                  {new Date(`${night.date}T00:00:00`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                </span>
                <div className="sleep-grid__track">
                  {inBed && (
                    <span className="sleep-grid__bar sleep-grid__bar--inbed" style={{ left: `${inBed.left}%`, width: `${inBed.width}%` }} />
                  )}
                  {asleep && (
                    <span className="sleep-grid__bar sleep-grid__bar--asleep" style={{ left: `${asleep.left}%`, width: `${asleep.width}%` }} />
                  )}
                  {night.nightmares && asleep && (
                    <span className="sleep-grid__nightmare" style={{ left: `${asleep.left + asleep.width / 2}%` }} />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="sleep-grid__legend">
          <span className="sleep-grid__legend-item"><span className="sleep-grid__swatch sleep-grid__swatch--inbed" />{t('evolution.sleep_legend_inbed')}</span>
          <span className="sleep-grid__legend-item"><span className="sleep-grid__swatch sleep-grid__swatch--asleep" />{t('evolution.sleep_legend_asleep')}</span>
          <span className="sleep-grid__legend-item"><span className="sleep-grid__swatch sleep-grid__swatch--nightmare" />{t('evolution.sleep_legend_nightmare')}</span>
        </div>
      </div>

      {/* Tendances : sélecteur de métrique + graphe précis ────────────────── */}
      <div className="sleep-trend">
        <div className="sleep-trend__chips">
          {SLEEP_METRICS.map(m => (
            <MetricChip
              key={m.key}
              metricKey={m.key}
              label={t(m.labelKey)}
              active={m.key === metric}
              onSelect={handleSelectMetric}
            />
          ))}
        </div>
        <div className="sleep-trend__head">
          <h4 className="module-data-panel__chart-title">{t(activeMetric.labelKey)}</h4>
          {comparison && delta != null ? (
            <span className="sleep-trend__delta">
              {comparison.label} · Δ {delta > 0 ? '+' : ''}{formatTrendValue(delta, activeMetric.unit)}
            </span>
          ) : null}
        </div>
        <div className="sleep-trend__cadence">
          <Toggle checked={rawMode} onChange={setRawMode} label={t('evolution.show_each_entry')} />
        </div>
        <TrendChart
          data={trendData}
          unit={activeMetric.unit}
          yDomain={trendDomain}
          meanLabel={t('evolution.trend_mean')}
          comparison={comparisonTrend ? { data: comparisonTrend, label: comparison?.label ?? '' } : undefined}
          gaps={gaps}
          noDataLabel={t('evolution.no_data_band')}
          locale={locale}
        />
      </div>
    </div>
  )
}
