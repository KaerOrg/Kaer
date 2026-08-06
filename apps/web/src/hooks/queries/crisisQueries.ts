import { queryOptions } from '@tanstack/react-query'
import { fetchCrisisPlanConfig } from '@services/crisisPlanService'
import { fetchSafetyPlanItems } from '@services/safetyPlanItemsService'

// Plan de crise d'un patient (message praticien affiché dans « Mes raisons de tenir »).
// Donnée patient volatile — éditable par le praticien — donc `staleTime` par défaut
// (30 s) plutôt qu'infini : on s'appuie sur l'invalidation à l'écriture
// (`useSaveCrisisPlan`) pour la fraîcheur, pas sur une péremption longue.
// Consommé par le widget d'aperçu des ancres (message praticien).
export const crisisQueries = {
  planConfig: (patientId: string | null | undefined) =>
    queryOptions({
      queryKey: ['crisis', 'planConfig', patientId ?? ''],
      queryFn: () => fetchCrisisPlanConfig(patientId!),
      enabled: !!patientId,
    }),

  // Items du plan de sécurité (PW-1, #320). Document co-édité : le patient peut
  // l'avoir modifié depuis son téléphone entre deux ouvertures, d'où le `staleTime`
  // par défaut et l'invalidation à chaque écriture praticien.
  planItems: (patientId: string | null | undefined) =>
    queryOptions({
      queryKey: ['crisis', 'planItems', patientId ?? ''],
      queryFn: () => fetchSafetyPlanItems(patientId!),
      enabled: !!patientId,
    }),
}
