import { queryOptions } from '@tanstack/react-query'
import { fetchCSSRSAssessments } from '@services/cssrsService'

// Évaluations C-SSRS d'un patient (dépistage du risque suicidaire). Donnée patient
// volatile — le praticien en crée / supprime — donc `staleTime` par défaut +
// invalidation à l'écriture, jamais de cache long. Clé par (patient, praticien).
export const cssrsQueries = {
  assessments: (patientId: string | undefined, practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['cssrs', 'assessments', patientId ?? '', practitionerId ?? ''],
      queryFn: () => fetchCSSRSAssessments(patientId!, practitionerId!),
      enabled: !!patientId && !!practitionerId,
    }),
}
