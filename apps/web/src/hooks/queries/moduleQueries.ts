import { queryOptions } from '@tanstack/react-query'
import { fetchModuleFields } from '@services/moduleService'
import { fetchDefusionTechniques, fetchBreathingPractitionerConfig } from '@services/moduleAssignmentService'
import { CONFIG_QUERY_OPTIONS } from './configCache'

// Config de rendu d'un module (module_content_fields + field_props). Quasi-statique
// → cache infini, invalidé par le jeton de version (cf. CONFIG_QUERY_OPTIONS).
export const moduleQueries = {
  fields: (moduleType: string) =>
    queryOptions({
      queryKey: ['module', 'fields', moduleType],
      queryFn: () => fetchModuleFields(moduleType),
      ...CONFIG_QUERY_OPTIONS,
    }),

  // Techniques de défusion activées pour un patient (config.enabled_techniques) —
  // pilote l'aperçu Vue patient (une technique désactivée n'apparaît pas dans le rail).
  defusionTechniques: (patientModuleId: string) =>
    queryOptions({
      queryKey: ['module', 'defusionTechniques', patientModuleId],
      queryFn: () => fetchDefusionTechniques(patientModuleId),
    }),

  // Activation praticien du module respiration (config.enabled_techniques,
  // primary_technique, weekly_goal_sessions). Lue par l'onglet « Techniques &
  // objectif » et par l'aperçu Vue patient : une seule clé, donc un seul fetch.
  breathingConfig: (patientModuleId: string) =>
    queryOptions({
      queryKey: ['module', 'breathingConfig', patientModuleId],
      queryFn: () => fetchBreathingPractitionerConfig(patientModuleId),
    }),
}
