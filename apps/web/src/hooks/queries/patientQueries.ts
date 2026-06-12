import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { resolvePatientRef } from '../../services/patientRefService'
import {
  fetchPatientHeader,
  setTeenMode as setTeenModeSvc,
  saveGeneralNote as saveGeneralNoteSvc,
} from '../../services/patientService'
import { fetchPatientModules } from '../../services/moduleAssignmentService'
import { fetchNotes } from '../../services/noteService'
import { fetchAppointmentsForPatient } from '../../services/appointmentService'

// Factories `queryOptions` du dossier patient (vue praticien).
// `resolveRef` traduit le token public de l'URL en patient_id réel ; toutes les
// autres queries sont activées une fois ce patient_id connu.
export const patientQueries = {
  resolveRef: (ref: string | undefined) =>
    queryOptions({
      queryKey: ['patient', 'resolveRef', ref ?? ''],
      queryFn: () => resolvePatientRef(ref!),
      enabled: ref != null,
    }),

  header: (practitionerId: string | undefined, patientId: string | null) =>
    queryOptions({
      queryKey: ['patient', 'header', practitionerId ?? '', patientId ?? ''],
      queryFn: () => fetchPatientHeader(practitionerId!, patientId!),
      enabled: practitionerId != null && patientId != null,
    }),

  modules: (patientId: string | null) =>
    queryOptions({
      queryKey: ['patient', 'modules', patientId ?? ''],
      queryFn: () => fetchPatientModules(patientId!),
      enabled: patientId != null,
    }),

  notes: (practitionerId: string | undefined, patientId: string | null) =>
    queryOptions({
      queryKey: ['patient', 'notes', practitionerId ?? '', patientId ?? ''],
      queryFn: () => fetchNotes(practitionerId!, patientId!),
      enabled: practitionerId != null && patientId != null,
    }),

  appointments: (practitionerId: string | undefined, patientId: string | null) =>
    queryOptions({
      queryKey: ['patient', 'appointments', practitionerId ?? '', patientId ?? ''],
      queryFn: () => fetchAppointmentsForPatient(practitionerId!, patientId!),
      enabled: practitionerId != null && patientId != null,
    }),
}

type TeenModeVars = { practitionerId: string; patientId: string; value: boolean }

// Bascule du mode ado. Au succès, met à jour le header en cache (pas de re-fetch).
export function useSetTeenMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: TeenModeVars) => setTeenModeSvc(v.practitionerId, v.patientId, v.value),
    onSuccess: (result, v) => {
      if (result.ok) {
        queryClient.setQueryData(
          patientQueries.header(v.practitionerId, v.patientId).queryKey,
          prev => (prev ? { ...prev, teenMode: v.value } : prev),
        )
      }
    },
  })
}

type GeneralNoteVars = { practitionerId: string; patientId: string; note: string }

// Sauvegarde de la note générale (overview). Pas d'invalidation : la valeur
// éditée est déjà l'état local du textarea.
export function useSaveGeneralNote() {
  return useMutation({
    mutationFn: (v: GeneralNoteVars) => saveGeneralNoteSvc(v.practitionerId, v.patientId, v.note),
  })
}
