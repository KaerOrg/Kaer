import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchScaleSchedule,
  fetchScaleSchedules,
  saveScaleSchedule,
  deleteScaleSchedule,
  type ScaleScheduleInput,
} from '@services/scaleScheduleService'

// Programmation des échelles d'un patient (K-6/K-7). Donnée éditée dans l'encart
// (enregistrer / supprimer) → invalidation à l'écriture. La clé `byScale` (encart)
// est un sur-ensemble du préfixe `byPatient` (colonne « Programmée » du tableau) :
// invalider le préfixe patient rafraîchit les deux.
export const scaleScheduleQueries = {
  /** Toutes les programmations du patient : alimente la colonne « Programmée » (K-7). */
  byPatient: (patientId: string) =>
    queryOptions({
      queryKey: ['scaleSchedule', patientId],
      queryFn: () => fetchScaleSchedules(patientId),
    }),
  /** Programmation d'une échelle : alimente l'encart Programmation (K-6). */
  byScale: (patientId: string, moduleId: string) =>
    queryOptions({
      queryKey: ['scaleSchedule', patientId, moduleId],
      queryFn: () => fetchScaleSchedule(patientId, moduleId),
    }),
}

/** Enregistre (upsert) la programmation puis invalide les queries du patient
 *  (préfixe `['scaleSchedule', patientId]` → encart + tableau). */
export function useSaveScaleSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ScaleScheduleInput) => saveScaleSchedule(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: scaleScheduleQueries.byPatient(input.patientId).queryKey })
    },
  })
}

/** Supprime la programmation puis invalide les queries du patient. */
export function useDeleteScaleSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, moduleId }: { patientId: string; moduleId: string }) =>
      deleteScaleSchedule(patientId, moduleId),
    onSuccess: (_data, { patientId }) => {
      qc.invalidateQueries({ queryKey: scaleScheduleQueries.byPatient(patientId).queryKey })
    },
  })
}
