import { queryOptions } from '@tanstack/react-query'
import { getRoutinesForPatientModule } from '@services/notificationRoutineService'

// Rappels programmés d'un module patient. Donnée volatile éditée dans le modal
// (create/toggle/delete) → `staleTime` par défaut + invalidation à l'écriture, pas de
// cache long. Une clé par `patient_module_id`.
export const notificationRoutineQueries = {
  byPatientModule: (patientModuleId: string) =>
    queryOptions({
      queryKey: ['notificationRoutine', 'byPatientModule', patientModuleId],
      queryFn: () => getRoutinesForPatientModule(patientModuleId),
      enabled: !!patientModuleId,
    }),
}
