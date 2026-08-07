import type { ScaleSchedule } from '@services/scaleScheduleService'

/** Fonction de traduction minimale : une clé, des paramètres, une chaîne. */
type Translate = (key: string, values?: Record<string, string | number>) => string

/** Jours de la semaine, 1 = lundi … 7 = dimanche (convention de `scale_schedules`). */
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/**
 * Met en phrase la cadence proposée par le praticien (#413).
 *
 * Fonction PURE, testée à part : l'assemblage « cadence + jour + heure » a trois
 * variantes optionnelles qui se combinent, et une erreur y produirait une phrase
 * bancale ou un morceau orphelin (« Toutes les 2 semaines, le  à  »).
 *
 * Les trois morceaux sont assemblés par des clés i18n distinctes plutôt que par
 * concaténation : l'ordre des mots n'est pas le même d'une langue à l'autre.
 */
export function formatCadence(schedule: ScaleSchedule, t: Translate): string {
  const frequency = t(`modules.scale_reminder.frequency_${schedule.frequency}`)

  // À la demande : ni jour ni heure n'ont de sens, et les afficher laisserait croire
  // à un rendez-vous fixe.
  if (schedule.frequency === 'on_demand') return frequency

  const dayIndex = schedule.dayOfWeek != null ? schedule.dayOfWeek - 1 : -1
  const day = dayIndex >= 0 && dayIndex < DAY_KEYS.length
    ? t(`modules.scale_reminder.day_${DAY_KEYS[dayIndex]}`)
    : null
  const time = schedule.timeOfDay

  if (day != null && time != null) {
    return t('modules.scale_reminder.cadence_day_time', { frequency, day, time })
  }
  if (day != null) return t('modules.scale_reminder.cadence_day', { frequency, day })
  if (time != null) return t('modules.scale_reminder.cadence_time', { frequency, time })
  return frequency
}
