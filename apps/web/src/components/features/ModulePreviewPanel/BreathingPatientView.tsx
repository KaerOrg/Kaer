import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { readBreathingTechniques, type BreathingTechniqueSpec } from '@kaer/shared'
import { moduleQueries } from '../../../hooks/queries'
import { PatientScreenRail, type StageFilter } from './PatientScreenRail'
import { buildBreathingScreens, type BreathingStage } from './breathingScreens'
import './BreathingPatientView.css'

interface Props {
  /** Row `patient_modules.id` : pilote les techniques activées et l'objectif. */
  patientModuleId?: string
}

/**
 * « Vue patient » de la respiration : les quatre écrans du parcours mobile (hub,
 * préparation, session, clôture) miniaturisés dans un rail, numérotés et légendés.
 *
 * L'aperçu reflète la **configuration réelle du patient** : ses techniques activées,
 * sa technique principale, son objectif hebdomadaire. Un praticien qui montre l'écran
 * en séance doit montrer celui que le patient a, pas une capture générique. Il se met
 * donc à jour dès qu'un enregistrement de l'onglet Configuration invalide la query.
 *
 * Lecture seule et sans interaction : rien ne se lance, rien ne s'enregistre. Les
 * saisies affichées sont des exemples déclarés dans `breathingScreens`, jamais de
 * vraies sessions du patient : celles-ci ont leur propre onglet.
 */
export function BreathingPatientView({ patientModuleId }: Props) {
  const { t } = useTranslation()
  const [stageFilter, setStageFilter] = useState<BreathingStage | 'all'>('all')

  const fieldsQuery = useQuery(moduleQueries.fields('breathing_techniques'))
  const configQuery = useQuery({
    ...moduleQueries.breathingConfig(patientModuleId ?? ''),
    enabled: patientModuleId != null,
  })

  const allTechniques = useMemo(
    () => readBreathingTechniques(fieldsQuery.data?.fields ?? []),
    [fieldsQuery.data],
  )

  const config = useMemo(() => {
    const enabledKeys = configQuery.data?.enabledTechniques ?? null
    // Sans configuration lue, on montre le catalogue complet plutôt qu'un écran vide :
    // l'aperçu reste informatif, et il se resserre dès que la config arrive.
    const techniques: BreathingTechniqueSpec[] = enabledKeys == null
      ? allTechniques
      : allTechniques.filter(technique => enabledKeys.includes(technique.key))
    const primaryKey = configQuery.data?.primaryTechnique ?? null
    const primary = techniques.find(technique => technique.key === primaryKey) ?? techniques[0] ?? null
    return { techniques, primary, weeklyGoal: configQuery.data?.weeklyGoalSessions ?? null }
  }, [allTechniques, configQuery.data])

  const screens = useMemo(() => buildBreathingScreens(t, config), [t, config])

  const stageFilters = useMemo<StageFilter<BreathingStage>[]>(() => [
    { value: 'all', label: t('patient.bpv_filter_all') },
    { value: 'hub', label: t('patient.bpv_cap_hub') },
    { value: 'preparation', label: t('patient.bpv_cap_preparation') },
    { value: 'session', label: t('patient.bpv_cap_session') },
    { value: 'closing', label: t('patient.bpv_cap_closing') },
  ], [t])

  const handleFilterChange = useCallback((value: BreathingStage | 'all') => setStageFilter(value), [])

  return (
    <PatientScreenRail
      screens={screens}
      filters={stageFilters}
      activeFilter={stageFilter}
      onFilterChange={handleFilterChange}
      bannerLabel={t('patient.bpv_banner')}
      footerLabel={t('patient.bpv_footer', { count: screens.length })}
    />
  )
}
