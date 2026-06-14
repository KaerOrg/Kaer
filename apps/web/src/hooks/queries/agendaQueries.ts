import { queryOptions } from '@tanstack/react-query'
import {
  fetchAvailabilityRules,
  fetchExceptions,
  fetchAppointmentsForWeek,
  fetchAutoConfirmSetting,
} from '../../services/appointmentService'
import { fetchPatientOptions } from '../../services/patientService'

// Factories `queryOptions` de l'agenda praticien.
// `exceptions` et `appointmentsForWeek` sont clés par semaine (from/to) → changer de
// semaine recharge automatiquement, tout en gardant en cache les semaines déjà vues.
// Les mutations (création/statut/note/replanif RDV, règles, auto-confirm) restent des
// appels service dans la page, suivis d'un `invalidateQueries` sur la clé concernée.
export const agendaQueries = {
  rules: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['agenda', 'rules', practitionerId ?? ''],
      queryFn: () => fetchAvailabilityRules(practitionerId!),
      enabled: practitionerId != null,
    }),

  exceptions: (practitionerId: string | undefined, from: string, to: string) =>
    queryOptions({
      queryKey: ['agenda', 'exceptions', practitionerId ?? '', from, to],
      queryFn: () => fetchExceptions(practitionerId!, from, to),
      enabled: practitionerId != null,
    }),

  appointmentsForWeek: (practitionerId: string | undefined, from: string, to: string) =>
    queryOptions({
      queryKey: ['agenda', 'appointments', practitionerId ?? '', from, to],
      queryFn: () => fetchAppointmentsForWeek(practitionerId!, from, to),
      enabled: practitionerId != null,
    }),

  patientOptions: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['agenda', 'patientOptions', practitionerId ?? ''],
      queryFn: () => fetchPatientOptions(practitionerId!),
      enabled: practitionerId != null,
    }),

  autoConfirm: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['agenda', 'autoConfirm', practitionerId ?? ''],
      queryFn: () => fetchAutoConfirmSetting(practitionerId!),
      enabled: practitionerId != null,
    }),
}
