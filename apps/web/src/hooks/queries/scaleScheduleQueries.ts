import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchScaleSchedule,
  saveScaleSchedule,
  deleteScaleSchedule,
  type ScaleScheduleInput,
} from '@services/scaleScheduleService'

// Programmation d'une échelle pour un patient (K-6). Donnée éditée dans l'encart
// (enregistrer / supprimer) → invalidation à l'écriture. Une clé par (patient, échelle).
export const scaleScheduleQueries = {
  byScale: (patientId: string, moduleId: string) =>
    queryOptions({
      queryKey: ['scaleSchedule', patientId, moduleId],
      queryFn: () => fetchScaleSchedule(patientId, moduleId),
    }),
}

/** Enregistre (upsert) la programmation puis invalide la query de l'échelle. */
export function useSaveScaleSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ScaleScheduleInput) => saveScaleSchedule(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: scaleScheduleQueries.byScale(input.patientId, input.moduleId).queryKey })
    },
  })
}

/** Supprime la programmation puis invalide la query de l'échelle. */
export function useDeleteScaleSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, moduleId }: { patientId: string; moduleId: string }) =>
      deleteScaleSchedule(patientId, moduleId),
    onSuccess: (_data, { patientId, moduleId }) => {
      qc.invalidateQueries({ queryKey: scaleScheduleQueries.byScale(patientId, moduleId).queryKey })
    },
  })
}
