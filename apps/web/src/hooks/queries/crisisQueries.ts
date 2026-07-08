import { queryOptions } from '@tanstack/react-query'
import { fetchCrisisPlanConfig } from '@services/crisisPlanService'

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
}
