import { computeScheduleStatus as computeShared } from '@kaer/shared'
import type { ScaleSchedule } from '@services/scaleScheduleService'

export type {
  RecurringFrequency,
  ScheduleStatus,
  SchedulePeriod,
} from '@kaer/shared'

/**
 * Adaptateur web de `computeScheduleStatus`, remonté dans `@kaer/shared` (#414).
 *
 * La logique est partagée pour que le praticien (colonne « Programmée », K-7) et le
 * patient (pastille d'échéance) voient la MÊME date pour la même programmation. Deux
 * implémentations divergeraient au premier changement de cadence, et c'est exactement
 * le défaut de parité déjà consigné dans `lessons.md`.
 *
 * Ne reste ici que la conversion de la ligne web (`snake_case`) vers le contrat
 * structurel partagé : le mobile fait la même chose depuis ses propres noms.
 */
export function computeScheduleStatus(params: {
  readonly schedule: ScaleSchedule | null
  readonly evaluationType: 'auto' | 'hetero'
  readonly lastActivityIso: string | null
  readonly todayIso: string
}) {
  const { schedule, ...rest } = params
  return computeShared({
    ...rest,
    schedule: schedule == null ? null : {
      mode: schedule.mode,
      frequency: schedule.frequency,
      createdAtIso: schedule.created_at,
      patientReminder: schedule.patient_reminder,
    },
  })
}
