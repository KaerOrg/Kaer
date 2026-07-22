import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DefusionPoint } from '@services/engagementService'
import { EvolutionSection } from '../../../components/features/EvolutionSection'
import { LineChart } from '../../../components/ui/Chart'
import { SegmentedControl, type SegmentOption } from '../../../components/ui/SegmentedControl'
import { filterByRange } from '../../../lib/chartConfig'
import { DEFUSION_BEFORE_COLOR, DEFUSION_AFTER_COLOR } from './clinicalChartConfig'
import type { DefusionTechniqueFilter } from './defusionData'

interface Props {
  points: DefusionPoint[]
  days: number
  locale: string
  expanded: boolean
  archivedLabel?: string
  onToggle: (sectionKey: string) => void
  onViewData?: (sectionKey: string) => void
  viewDataLabel?: string
}

const TECHNIQUE_FILTERS: readonly DefusionTechniqueFilter[] = ['all', 'word_repetition', 'linguistic_distancing']

/**
 * Section « Évolution » de « Décrocher d'une pensée ». Deux sous-graphes SÉPARÉS
 * (Inconfort 0-10, Conviction 0-10), chacun deux séries (avant = neutre, après =
 * teal) — jamais un score composite. Filtre par technique au-dessus des graphes.
 * MDR : points bruts (mesures passées non tracées), aucun écart, aucune flèche ; le
 * mot travaillé n'apparaît jamais ici.
 */
export function DefusionEvolutionSection({
  points, days, locale, expanded, archivedLabel, onToggle, onViewData, viewDataLabel,
}: Props) {
  const { t } = useTranslation()
  const [technique, setTechnique] = useState<DefusionTechniqueFilter>('all')

  const filtered = useMemo(() => {
    const inRange = filterByRange(points, days)
    return technique === 'all' ? inRange : inRange.filter(p => p.technique === technique)
  }, [points, days, technique])

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

  const techniqueOptions = useMemo<readonly SegmentOption<DefusionTechniqueFilter>[]>(
    () => TECHNIQUE_FILTERS.map(f => ({
      value: f,
      label: f === 'all'
        ? t('patient.defusion_technique_all')
        : t(`modules.cognitive_saturation.technique_${f}_name`),
    })),
    [t],
  )

  return (
    <EvolutionSection
      sectionKey="cognitive_saturation"
      anchorId="evo-section-cognitive_saturation"
      title={t('evolution.defusion_title')}
      badge={t('evolution.n_sessions', { count: filtered.length })}
      archivedLabel={archivedLabel}
      expanded={expanded}
      onToggle={onToggle}
      viewDataLabel={viewDataLabel}
      onViewData={onViewData}
    >
      <SegmentedControl
        options={techniqueOptions}
        value={technique}
        onChange={setTechnique}
        ariaLabel={t('evolution.defusion_title')}
      />

      <h5 className="evolution__subchart-title">{t('patient.defusion_chart_discomfort')}</h5>
      {discomfortData.length >= 2 ? (
        <LineChart data={discomfortData} series={series} yDomain={[0, 10]} showLegend showDots locale={locale} />
      ) : (
        <p className="evolution-card__no-data">{t('evolution.not_enough_data')}</p>
      )}

      <h5 className="evolution__subchart-title">{t('patient.defusion_chart_belief')}</h5>
      {beliefData.length >= 2 ? (
        <LineChart data={beliefData} series={series} yDomain={[0, 10]} showLegend showDots locale={locale} />
      ) : (
        <p className="evolution-card__no-data">{t('evolution.not_enough_data')}</p>
      )}

      <p className="evolution-card__mention">{t('evolution.defusion_note')}</p>
    </EvolutionSection>
  )
}
