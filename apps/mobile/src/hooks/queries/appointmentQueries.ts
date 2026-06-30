import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPatientAppointments,
  fetchPatientPractitioner,
  fetchPractitionerRules,
  fetchPractitionerExceptions,
  fetchBookedSlots,
  cancelAppointment,
} from '@services/appointmentService'

// Factories `queryOptions` des rendez-vous côté patient.
export const appointmentQueries = {
  patientAppointments: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['appointments', 'list', patientId ?? ''],
      queryFn: () => fetchPatientAppointments(patientId!),
      enabled: patientId != null,
    }),

  patientPractitioner: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['appointments', 'practitioner', patientId ?? ''],
      queryFn: () => fetchPatientPractitioner(patientId!),
      enabled: patientId != null,
    }),

  // ── Prise de RDV (créneaux disponibles) ─────────────────────────────────
  practitionerRules: (practitionerId: string) =>
    queryOptions({
      queryKey: ['appointments', 'rules', practitionerId],
      queryFn: () => fetchPractitionerRules(practitionerId),
    }),

  practitionerExceptions: (practitionerId: string, from: string, to: string) =>
    queryOptions({
      queryKey: ['appointments', 'exceptions', practitionerId, from, to],
      queryFn: () => fetchPractitionerExceptions(practitionerId, from, to),
    }),

  // `date` indéfinie → désactivée (aucune date sélectionnée). `appointmentId`
  // entre dans la clé : en replanification, le créneau courant est exclu des réservés.
  bookedSlots: (practitionerId: string, date: string | null, appointmentId: string | undefined) =>
    queryOptions({
      queryKey: ['appointments', 'bookedSlots', practitionerId, date ?? '', appointmentId ?? ''],
      queryFn: () => fetchBookedSlots(practitionerId, date!, appointmentId),
      enabled: date != null,
    }),
}

// Annulation d'un rendez-vous. Invalide la liste du patient au succès.
export function useCancelAppointment(patientId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentQueries.patientAppointments(patientId).queryKey,
      })
    },
  })
}
