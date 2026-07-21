import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FearPoint } from '@services/engagementService'
import { LineChart } from '../../../components/ui/Chart'
import { Chip } from '../../../components/ui/Chip'
import { SegmentedControl, type SegmentOption } from '../../../components/ui/SegmentedControl'
import { type TimeRange, RANGE_DAYS, TIME_RANGES, filterByRange } from '../../../lib/chartConfig'
import { FEAR_BEFORE_COLOR, FEAR_PEAK_COLOR, FEAR_AFTER_COLOR } from './clinicalChartConfig'
import './ExposureDataPanel.css'

interface Props {
  points: FearPoint[]
  locale: string
}

/**
 * Onglet « Données » de l'exposition graduée (praticien) : courbe SUDS à trois
 * séries (anticipé / pic / final), filtrable par situation et par période.
 *
 * MDR 2017/745 : valeurs brutes tracées, aucune interprétation, aucun seuil,
 * aucune couleur de valence. La vue par situation évite que la courbe agrégée
 * n'écrase le signal de désensibilisation quand le patient change de marche.
 */
export function ExposureDataPanel({ points, locale }: Props) {
  const { t } = useTranslation()
  const [range, setRange] = useState<TimeRange>('1y')
  // null = « Toutes les situations » (pas de filtre).
  const [situation, setSituation] = useState<string | null>(null)

  // Situations distinctes présentes dans les données (ordre d'apparition).
  const situations = useMemo(() => {
    const seen = new Set<string>()
    for (const p of points) if (p.situation) seen.add(p.situation)
    return [...seen]
  }, [points])

  const rangeOptions = useMemo<readonly SegmentOption<TimeRange>[]>(
    () => TIME_RANGES.map(r => ({ value: r, label: t(`evolution.range_${r}`) })),
    [t],
  )

  const chartData = useMemo(() => {
    const inRange = filterByRange(points, RANGE_DAYS[range])
    const scoped = situation == null ? inRange : inRange.filter(p => p.situation === situation)
    return scoped.map(p => ({
      date: p.date,
      suds_before: p.suds_before,
      suds_peak: p.suds_peak,
      suds_after: p.suds_after,
    }))
  }, [points, range, situation])

  const series = useMemo(
    () => [
      { key: 'suds_before', color: FEAR_BEFORE_COLOR, label: t('evolution.fear_before') },
      { key: 'suds_peak', color: FEAR_PEAK_COLOR, label: t('evolution.fear_peak'), dashed: true },
      { key: 'suds_after', color: FEAR_AFTER_COLOR, label: t('evolution.fear_after') },
    ],
    [t],
  )

  return (
    <div className="exposure-data-panel">
      <div className="exposure-data-panel__head">
        <h4 className="exposure-data-panel__title">{t('patient.exposure_data_title')}</h4>
        <div className="exposure-data-panel__controls">
          <span className="exposure-data-panel__count">{t('evolution.n_sessions', { count: chartData.length })}</span>
          <SegmentedControl
            options={rangeOptions}
            value={range}
            onChange={setRange}
            ariaLabel={t('patient.exposure_data_title')}
          />
        </div>
      </div>

      {situations.length > 0 && (
        <div className="exposure-data-panel__filters">
          <Chip
            label={t('patient.exposure_all_situations')}
            selectable
            selected={situation == null}
            onClick={() => setSituation(null)}
          />
          {situations.map(s => (
            <Chip
              key={s}
              label={s}
              selectable
              selected={situation === s}
              onClick={() => setSituation(s)}
            />
          ))}
        </div>
      )}

      {chartData.length >= 2 ? (
        <LineChart
          data={chartData}
          series={series}
          yDomain={[0, 100]}
          showLegend
          showDots
          locale={locale}
        />
      ) : (
        <p className="exposure-data-panel__note">{t('evolution.not_enough_data')}</p>
      )}

      <p className="exposure-data-panel__mention">{t('patient.exposure_data_note')}</p>
    </div>
  )
}
