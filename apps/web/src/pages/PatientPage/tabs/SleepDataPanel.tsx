import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SleepPoint } from '@services/engagementService'
import { ModuleChart } from './ModuleChart'
import { barGeometry, formatMinutes, avg } from './sleepGrid'
import './SleepDataPanel.css'

interface Props {
  points: SleepPoint[]
  locale: string
}

// Repères horaires de l'axe noon→noon (toutes les 6 h).
const AXIS_TICKS = [
  { pos: 0, label: '12h' },
  { pos: 25, label: '18h' },
  { pos: 50, label: '0h' },
  { pos: 75, label: '6h' },
  { pos: 100, label: '12h' },
] as const

/**
 * Panneau « Données » de l'agenda du sommeil pour le praticien : grille agenda
 * (barres 24h par nuit), courbes d'efficacité et de temps de sommeil, stats
 * moyennes. Présentationnel : points calculés en amont (engagementService).
 * Côté praticien, le codage visuel des métriques est autorisé (analyse soignant).
 */
export function SleepDataPanel({ points, locale }: Props) {
  const { t } = useTranslation()

  const efficiencyData = useMemo(
    () => points.filter(p => p.efficiency != null).map(p => ({ date: p.date, efficiency: p.efficiency as number })),
    [points],
  )
  const sleepData = useMemo(
    () => points
      .filter(p => p.total_sleep_min != null)
      .map(p => ({ date: p.date, hours: Math.round(((p.total_sleep_min as number) / 60) * 10) / 10 })),
    [points],
  )

  const stats = useMemo(() => {
    const eff = points.map(p => p.efficiency).filter((v): v is number => v != null)
    const tst = points.map(p => p.total_sleep_min).filter((v): v is number => v != null)
    const sol = points.map(p => p.onset_min)
    const waso = points.map(p => p.waso_min)
    return {
      avgEfficiency: avg(eff),
      avgSleep: avg(tst),
      avgOnset: avg(sol),
      avgWaso: avg(waso),
      nights: points.length,
      nightmares: points.filter(p => p.nightmares).length,
    }
  }, [points])

  // Grille : nuits les plus récentes en premier, plafonnées à 21 pour la lisibilité.
  const gridNights = useMemo(() => points.slice(-21).reverse(), [points])

  return (
    <div className="module-data-panel">
      {/* Stats moyennes ───────────────────────────────────────────────── */}
      <div className="sleep-stats">
        <div className="sleep-stats__item">
          <span className="sleep-stats__value">{stats.avgEfficiency != null ? `${stats.avgEfficiency} %` : '-'}</span>
          <span className="sleep-stats__label">{t('evolution.sleep_avg_efficiency')}</span>
        </div>
        <div className="sleep-stats__item">
          <span className="sleep-stats__value">{stats.avgSleep != null ? formatMinutes(stats.avgSleep) : '-'}</span>
          <span className="sleep-stats__label">{t('evolution.sleep_avg_duration')}</span>
        </div>
        <div className="sleep-stats__item">
          <span className="sleep-stats__value">{stats.avgOnset != null ? formatMinutes(stats.avgOnset) : '-'}</span>
          <span className="sleep-stats__label">{t('evolution.sleep_avg_onset')}</span>
        </div>
        <div className="sleep-stats__item">
          <span className="sleep-stats__value">{stats.avgWaso != null ? formatMinutes(stats.avgWaso) : '-'}</span>
          <span className="sleep-stats__label">{t('evolution.sleep_avg_waso')}</span>
        </div>
        <div className="sleep-stats__item">
          <span className="sleep-stats__value">{stats.nights}</span>
          <span className="sleep-stats__label">{t('evolution.sleep_nights')}</span>
        </div>
        <div className="sleep-stats__item">
          <span className="sleep-stats__value">{stats.nightmares}</span>
          <span className="sleep-stats__label">{t('evolution.sleep_nightmares')}</span>
        </div>
      </div>

      {/* Grille agenda du sommeil ─────────────────────────────────────── */}
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

      {/* Courbes de tendance ──────────────────────────────────────────── */}
      <ModuleChart
        title={t('evolution.sleep_efficiency_title')}
        count={efficiencyData.length}
        data={efficiencyData}
        series={[{ key: 'efficiency', color: '#06B6D4', label: t('evolution.sleep_efficiency_title') }]}
        yDomain={[0, 100]}
        locale={locale}
      />
      <ModuleChart
        title={t('evolution.sleep_duration_title')}
        count={sleepData.length}
        data={sleepData}
        series={[{ key: 'hours', color: '#6366F1', label: t('evolution.sleep_duration_title') }]}
        yDomain={[0, 12]}
        locale={locale}
      />
    </div>
  )
}
