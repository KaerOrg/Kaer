import type { BreathingReminder } from '@services/engagementService'

/**
 * Ordre d'affichage de la semaine, au format `Date.getDay()` (0 = dimanche).
 * `reminder_days` stocke dans cette convention ; la semaine s'affiche du lundi au
 * dimanche. Les deux se croisent ici, une seule fois.
 */
const DISPLAY_WEEK_JS_DAYS = [1, 2, 3, 4, 5, 6, 0] as const

/** Clés i18n des initiales, dans l'ordre d'affichage (`notifications.day_abbr_*`). */
export const DISPLAY_WEEK_DAY_KEYS = [
  'lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim',
] as const

/**
 * Jours d'un rappel, dans l'ordre d'affichage. `dayLabels` est indexé par cet ordre.
 * Rend une chaîne vide sans jour coché : l'appelant décide quoi afficher à la place.
 */
export function formatReminderDays(
  days: readonly number[],
  dayLabels: readonly string[],
): string {
  const selected = new Set(days)
  return DISPLAY_WEEK_JS_DAYS
    .map((jsDay, index) => (selected.has(jsDay) ? dayLabels[index] : null))
    .filter((label): label is string => label != null)
    .join(' · ')
}

/**
 * Le rappel est-il réellement actif ? La bascule seule ne suffit pas : sans heure ni
 * jour, rien ne se déclenche côté patient, et l'afficher comme actif mentirait au
 * praticien.
 */
export function isReminderActive(reminder: BreathingReminder | null): boolean {
  return reminder != null && reminder.enabled && reminder.time != null && reminder.days.length > 0
}
