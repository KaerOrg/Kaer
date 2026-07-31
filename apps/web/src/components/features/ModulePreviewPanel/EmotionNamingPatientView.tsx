import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { moduleQueries } from '../../../hooks/queries'
import { buildNamingTaxonomy, readIntensityMax } from '../../../lib/emotionNamingData'
import { PatientScreenRail, type StageFilter } from './PatientScreenRail'
import { buildNamingScreens, type NamingStage } from './emotionNamingScreens'
import './EmotionNamingPatientView.css'

const STAGES: NamingStage[] = ['discovery', 'entry', 'wordless', 'review', 'settings']

/**
 * « Vue patient » de « Nommer ce que je ressens » : rail horizontal des neuf écrans du
 * parcours patient, numérotés et légendés, avec des puces de filtre par étape.
 *
 * La navigation est un DÉFILEMENT, pas un parcours cliquable : en séance, le praticien
 * veut voir les neuf écrans d'un coup d'oeil, pas rejouer le parcours tap par tap.
 * Lecture seule, données d'exemple, aucune interaction patient simulée (MDR).
 *
 * Ce qui vient de la base : la liste des familles, leur teinte pastel et la borne de
 * l'échelle d'intensité. Ce qui vient du code : la composition des écrans, avec la
 * contrepartie expliquée en tête de `emotionNamingScreens.tsx`.
 */
export function EmotionNamingPatientView() {
  const { t } = useTranslation()
  const [stageFilter, setStageFilter] = useState<NamingStage | 'all'>('all')

  const fieldsQuery = useQuery(moduleQueries.fields('emotion_wheel'))
  const fields = useMemo(() => fieldsQuery.data?.fields ?? [], [fieldsQuery.data])
  const taxonomy = useMemo(() => buildNamingTaxonomy(fields), [fields])
  const intensityMax = useMemo(() => readIntensityMax(fields), [fields])

  const screens = useMemo(
    () => buildNamingScreens({
      t, families: taxonomy.families, colorByFamily: taxonomy.colorByFamily, intensityMax,
    }),
    [t, taxonomy, intensityMax],
  )

  const filters = useMemo<StageFilter<NamingStage>[]>(() => [
    { value: 'all', label: t('patient.enpv_filter_all') },
    ...STAGES.map(stage => ({ value: stage, label: t(`patient.enpv_filter_${stage}`) })),
  ], [t])

  const handleFilterChange = useCallback((value: NamingStage | 'all') => setStageFilter(value), [])

  return (
    <PatientScreenRail
      screens={screens}
      filters={filters}
      activeFilter={stageFilter}
      onFilterChange={handleFilterChange}
      bannerLabel={t('patient.preview_banner')}
      footerLabel={t('patient.enpv_footer', { count: screens.length })}
      previousLabel={t('patient.rail_previous')}
      nextLabel={t('patient.rail_next')}
    />
  )
}
