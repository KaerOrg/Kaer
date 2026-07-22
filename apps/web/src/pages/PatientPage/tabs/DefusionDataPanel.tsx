import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DefusionPoint } from '@services/engagementService'
import { LineChart } from '../../../components/ui/Chart'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { SegmentedControl, type SegmentOption } from '../../../components/ui/SegmentedControl'
import { DEFUSION_BEFORE_COLOR, DEFUSION_AFTER_COLOR } from './clinicalChartConfig'
import {
  filterSessions,
  computeSynthesis,
  groupByMonth,
  DEFUSION_PERIODS,
  type DefusionPeriod,
  type DefusionTechniqueFilter,
} from './defusionData'
import { DefusionSessionsTable } from './DefusionSessionsTable'
import './DefusionDataPanel.css'

interface Props {
  points: DefusionPoint[]
  locale: string
}

const INITIAL_VISIBLE_MONTHS = 2

/**
 * Onglet « Données » de « Décrocher d'une pensée » (praticien). Vue complète
 * autosuffisante : synthèse (3 cartes), deux graphes Inconfort / Conviction (séries
 * avant = neutre, après = teal), et tableau chronologique groupé par mois filtrable
 * par technique et période. Le mot est masqué par défaut (projection en staff).
 *
 * MDR 2017/745 : valeurs brutes uniquement, aucun écart calculé, aucune flèche,
 * aucune couleur selon la valeur (les deux séries ont une teinte d'identité fixe).
 */
export function DefusionDataPanel({ points, locale }: Props) {
  const { t } = useTranslation()
  const [technique, setTechnique] = useState<DefusionTechniqueFilter>('all')
  const [period, setPeriod] = useState<DefusionPeriod>('all')
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_VISIBLE_MONTHS)
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set())

  const filtered = useMemo(() => filterSessions(points, technique, period), [points, technique, period])
  const synthesis = useMemo(() => computeSynthesis(filtered), [filtered])
  const groups = useMemo(() => groupByMonth(filtered), [filtered])
  const visibleGroups = useMemo(() => groups.slice(0, visibleMonths), [groups, visibleMonths])

  const discomfortData = useMemo(
    () => filtered.map(p => ({ date: p.date, before: p.discomfort_before, after: p.discomfort_after })),
    [filtered],
  )
  const beliefData = useMemo(
    () => filtered.map(p => ({ date: p.date, before: p.belief_before, after: p.belief_after })),
    [filtered],
  )
  const series = useMemo(
    () => [
      { key: 'before', color: DEFUSION_BEFORE_COLOR, label: t('patient.defusion_series_before') },
      { key: 'after', color: DEFUSION_AFTER_COLOR, label: t('patient.defusion_series_after') },
    ],
    [t],
  )

  const periodOptions = useMemo<readonly SegmentOption<DefusionPeriod>[]>(
    () => DEFUSION_PERIODS.map(p => ({ value: p, label: t(`patient.defusion_period_${p}`) })),
    [t],
  )

  const handleAll = useCallback(() => setTechnique('all'), [])
  const handleWord = useCallback(() => setTechnique('word_repetition'), [])
  const handleDistancing = useCallback(() => setTechnique('linguistic_distancing'), [])
  const handleReveal = useCallback((key: string) => setRevealed(prev => new Set(prev).add(key)), [])
  const showMore = useCallback(() => setVisibleMonths(n => n + 1), [])

  const lastDateLabel = synthesis.lastDate
    ? new Date(synthesis.lastDate).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : '-'

  const hiddenNext = groups[visibleMonths]
  const hiddenMonthLabel = hiddenNext
    ? new Date(`${hiddenNext.monthKey}-01T00:00:00`).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="defusion-data-panel">
      {/* Synthèse — 3 cartes brutes, reflètent les filtres actifs. */}
      <div className="defusion-data-panel__synth">
        <Card variant="outlined">
          <span className="defusion-stat__label">{t('patient.defusion_stat_sessions')}</span>
          <span className="defusion-stat__value">{synthesis.total}</span>
        </Card>
        <Card variant="outlined">
          <span className="defusion-stat__label">{t('patient.defusion_stat_last')}</span>
          <span className="defusion-stat__value">{lastDateLabel}</span>
        </Card>
        <Card variant="outlined">
          <span className="defusion-stat__label">{t('patient.defusion_stat_with_measures')}</span>
          <span className="defusion-stat__value">{synthesis.withMeasures} / {synthesis.total}</span>
        </Card>
      </div>

      {/* Barre d'outils : filtre technique + période. */}
      <div className="defusion-data-panel__toolbar">
        <div className="defusion-data-panel__filters">
          <Chip label={t('patient.defusion_technique_all')} selectable selected={technique === 'all'} onClick={handleAll} />
          <Chip label={t('modules.cognitive_saturation.technique_word_repetition_name')} selectable selected={technique === 'word_repetition'} onClick={handleWord} />
          <Chip label={t('modules.cognitive_saturation.technique_linguistic_distancing_name')} selectable selected={technique === 'linguistic_distancing'} onClick={handleDistancing} />
        </div>
        <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} ariaLabel={t('patient.defusion_data_title')} />
      </div>

      {/* Deux graphes côte à côte : Inconfort / Conviction. */}
      <div className="defusion-data-panel__charts">
        <div className="defusion-data-panel__chart">
          <h5 className="defusion-data-panel__chart-title">{t('patient.defusion_chart_discomfort')}</h5>
          {discomfortData.length >= 2 ? (
            <LineChart data={discomfortData} series={series} yDomain={[0, 10]} showLegend showDots locale={locale} />
          ) : (
            <p className="defusion-data-panel__note">{t('evolution.not_enough_data')}</p>
          )}
        </div>
        <div className="defusion-data-panel__chart">
          <h5 className="defusion-data-panel__chart-title">{t('patient.defusion_chart_belief')}</h5>
          {beliefData.length >= 2 ? (
            <LineChart data={beliefData} series={series} yDomain={[0, 10]} showLegend showDots locale={locale} />
          ) : (
            <p className="defusion-data-panel__note">{t('evolution.not_enough_data')}</p>
          )}
        </div>
      </div>

      {/* Tableau chronologique groupé par mois. */}
      {visibleGroups.length > 0 ? (
        <DefusionSessionsTable groups={visibleGroups} locale={locale} revealed={revealed} onReveal={handleReveal} />
      ) : (
        <p className="defusion-data-panel__note">{t('patient.summary_empty')}</p>
      )}

      {groups.length > visibleMonths && (
        <Button variant="ghost" size="sm" className="defusion-data-panel__more" onClick={showMore}>
          {t('patient.defusion_load_older', { count: hiddenNext?.points.length ?? 0, month: hiddenMonthLabel })}
        </Button>
      )}

      <p className="defusion-data-panel__mention">{t('patient.defusion_data_note')}</p>
    </div>
  )
}
