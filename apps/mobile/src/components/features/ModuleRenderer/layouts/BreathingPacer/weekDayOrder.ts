// Ordre d'affichage de la semaine et formatage des jours de rappel.
//
// `breathing_settings.reminder_days` stocke des jours au format `Date.getDay()`
// (0 = dimanche), alors que la semaine s'affiche du lundi au dimanche : les deux
// conventions se croisent ici, une seule fois, plutôt que dans chaque composant.

/** Les jours de la semaine en ordre d'affichage (lundi → dimanche), au format `getDay()`. */
export const DISPLAY_WEEK_JS_DAYS = [1, 2, 3, 4, 5, 6, 0] as const

/** Clés i18n des initiales de jour, dans l'ordre d'affichage (`notifications.day_*`). */
export const DISPLAY_WEEK_DAY_KEYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] as const

/** Séparateur des listes de jours, aligné sur le reste de l'app. */
const SEPARATOR = ' · '

/**
 * Résumé des jours d'un rappel : « tous les jours » quand les sept sont cochés,
 * sinon les initiales dans l'ordre d'affichage (« L · M · J »).
 * `dayLabels` est indexé par l'ordre d'affichage, comme `DISPLAY_WEEK_DAY_KEYS`.
 */
export function formatReminderDays(
  days: readonly number[],
  dayLabels: readonly string[],
  everyDayLabel: string,
): string {
  const selected = new Set(days)
  if (selected.size >= DISPLAY_WEEK_JS_DAYS.length) return everyDayLabel
  return DISPLAY_WEEK_JS_DAYS
    .map((jsDay, index) => (selected.has(jsDay) ? dayLabels[index] : null))
    .filter((label): label is string => label != null)
    .join(SEPARATOR)
}

/** Ajoute ou retire un jour de la sélection, en gardant l'ordre croissant. */
export function toggleReminderDay(days: readonly number[], jsDay: number): number[] {
  return days.includes(jsDay)
    ? days.filter((d) => d !== jsDay)
    : [...days, jsDay].sort((a, b) => a - b)
}
