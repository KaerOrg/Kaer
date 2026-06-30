import { queryOptions } from '@tanstack/react-query'
import { fetchPatientModuleConfig } from '@services/moduleService'

// Factories `queryOptions` du moteur de module (côté patient).
// NB : `fetchModuleFields` n'est PAS ici — ce service a déjà son propre cache mémoire
// (Map de session). Seule la config patient (non cachée, rafraîchie au focus) passe
// par TanStack. L'appelant affine `enabled` (ex. uniquement pour preview_kind
// 'patient_scenario') en surchargeant l'option au spread.
export const moduleQueries = {
  patientModuleConfig: (patientId: string | undefined, moduleType: string) =>
    queryOptions({
      queryKey: ['module', 'patientConfig', patientId ?? '', moduleType],
      queryFn: () => fetchPatientModuleConfig(patientId!, moduleType),
      enabled: patientId != null,
    }),
}
