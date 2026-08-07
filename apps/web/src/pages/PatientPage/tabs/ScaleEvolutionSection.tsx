import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { readScaleSource } from '@kaer/shared'
import type { ModuleType } from '../../../lib/database.types'
import { engagementQueries, moduleQueries } from '../../../hooks/queries'
import { SegmentedControl, type SegmentOption } from '../../../components/ui/SegmentedControl'
import { readMaxScore } from '../../../components/features/ScalePassationDetail'
import {
  ScaleEvolutionChart, filterByWindow, EVOLUTION_WINDOWS,
  type EvolutionBand, type EvolutionWindow,
} from '../../../components/features/ScaleEvolutionChart'
import { readTrackedItems, toEvolutionEntries } from './scaleEvolutionData'
import { SCALE_CONFIG, DEFAULT_SCALE_COLOR } from './clinicalChartConfig'

interface Props {
  patientId: string
  moduleType: ModuleType
}

/**
 * Section Évolution d'une échelle : orchestre les lectures, le rendu vit dans
 * `ScaleEvolutionChart` (#420, QW-3).
 *
 * La fenêtre de lecture est propre à cette vue (6 mois / 1 an / tout) : le sélecteur
 * global de l'onglet propose 1 mois et 3 mois, qui ne montrent que deux points sur un
 * instrument bimensuel, et n'offre pas « tout ».
 */
export function ScaleEvolutionSection({ patientId, moduleType }: Props) {
  const { t, i18n } = useTranslation()
  const passationsQuery = useQuery(engagementQueries.scalePassations(patientId, moduleType))
  const fieldsQuery = useQuery(moduleQueries.fields(moduleType))
  const [window, setWindow] = useState<EvolutionWindow>('6m')

  const fields = useMemo(() => fieldsQuery.data?.fields ?? [], [fieldsQuery.data])
  const tracked = useMemo(() => readTrackedItems(fields), [fields])
  const source = useMemo(() => readScaleSource(fields), [fields])

  const entries = useMemo(
    () => filterByWindow(
      toEvolutionEntries(passationsQuery.data ?? [], fields, tracked),
      window,
    ),
    [passationsQuery.data, fields, tracked, window],
  )

  const bands = useMemo<EvolutionBand[]>(
    () => tracked.map(item => ({
      id: item.fieldId,
      label: item.scored
        ? t('scales.evolution.band_item', { position: item.position })
        : t('scales.evolution.band_item_unscored', { position: item.position }),
    })),
    [tracked, t],
  )

  const windowOptions = useMemo<readonly SegmentOption<EvolutionWindow>[]>(
    () => EVOLUTION_WINDOWS.map(w => ({ value: w, label: t(`scales.evolution.window_${w}`) })),
    [t],
  )

  // Borne haute de l'axe : dérivée de la configuration de l'échelle, jamais écrite en
  // dur. Le preset de couleur reste le seul recours si la config ne la donne pas.
  const yMax = useMemo(
    () => readMaxScore(fields) ?? SCALE_CONFIG[moduleType]?.yMax ?? 27,
    [fields, moduleType],
  )
  const color = SCALE_CONFIG[moduleType]?.color ?? DEFAULT_SCALE_COLOR

  if (passationsQuery.isLoading || fieldsQuery.isLoading) {
    return <p className="evolution-card__no-data">{t('common.loading')}</p>
  }

  return (
    <>
      <div className="evolution__compare">
        <SegmentedControl
          options={windowOptions}
          value={window}
          onChange={setWindow}
          variant="pills"
          ariaLabel={t('scales.evolution.window_label')}
        />
      </div>
      <ScaleEvolutionChart
        entries={entries}
        bands={bands}
        yMax={yMax}
        color={color}
        locale={i18n.language}
        citation={source.citation}
        translationAttribution={source.translationAttribution}
        t={t}
      />
    </>
  )
}
