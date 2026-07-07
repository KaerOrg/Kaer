import { queryOptions } from '@tanstack/react-query'
import { fetchCrisisPlanConfig } from '@services/crisisPlanService'

// Plan de crise d'un patient (message praticien, coping cards, phrase d'engagement).
// Donnée patient volatile — éditable par le praticien — donc `staleTime` par défaut
// (30 s) plutôt qu'infini : on s'appuie sur l'invalidation à l'écriture
// (`useSaveCrisisPlan`) pour la fraîcheur, pas sur une péremption longue.
// Partagé par les 3 widgets d'aperçu (anchors / coping cards / commitment) → un seul
// fetch réseau grâce à la déduplication de la clé.
export const crisisQueries = {
  planConfig: (patientId: string | null | undefined) =>
    queryOptions({
      queryKey: ['crisis', 'planConfig', patientId ?? ''],
      queryFn: () => fetchCrisisPlanConfig(patientId!),
      enabled: !!patientId,
    }),
}
