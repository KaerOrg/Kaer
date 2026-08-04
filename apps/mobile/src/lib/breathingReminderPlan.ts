// Ce qu'il faut programmer comme rappels, à partir des réglages du patient.
//
// Logique pure, sans appel système : elle traduit `breathing_settings` en une liste
// d'occurrences hebdomadaires, ce qui rend testable la partie où les erreurs se
// glissent (conversion des jours, analyse de l'heure) sans toucher aux notifications.
//
// Conformité MDR 2017/745 : ce module décide QUAND un rappel se déclenche, à partir
// des seuls choix du patient. Il ne lit aucune donnée de pratique, aucun compte de
// sessions, aucun objectif. Un rappel n'est jamais conditionné par l'état des données.

/** Une occurrence hebdomadaire à programmer. */
export interface ReminderOccurrence {
  /**
   * Jour au format `expo-notifications` : 1 = dimanche … 7 = samedi.
   * `breathing_settings.reminder_days` utilise `Date.getDay()` (0 = dimanche) :
   * les deux conventions se croisent ici, une seule fois.
   */
  weekday: number
  hour: number
  minute: number
}

/** Les réglages dont dépend la programmation, et eux seuls. */
export interface ReminderSettings {
  readonly reminder_enabled: boolean
  /** « HH:MM », ou `null` si aucune heure n'a été choisie. */
  readonly reminder_time: string | null
  /** Jours au format `Date.getDay()` (0 = dimanche). */
  readonly reminder_days: readonly number[]
}

const HHMM = /^(\d{1,2}):(\d{2})$/

/** Heure et minute d'une chaîne « HH:MM », ou `null` si elle est inexploitable. */
function parseTime(value: string): { hour: number; minute: number } | null {
  const match = HHMM.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

/**
 * Les occurrences à programmer, une par jour coché, triées par jour.
 *
 * Rend `[]` dans tous les cas où il ne doit y avoir **aucun** rappel : bascule
 * coupée, heure absente ou illisible, aucun jour coché. L'appelant se contente
 * alors d'annuler ce qui existait, ce qui garantit l'opt-in strict.
 */
export function buildReminderPlan(settings: ReminderSettings): ReminderOccurrence[] {
  if (!settings.reminder_enabled || settings.reminder_time == null) return []

  const time = parseTime(settings.reminder_time)
  if (time == null) return []

  const days = [...new Set(settings.reminder_days)]
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b)

  return days.map(day => ({ weekday: day + 1, hour: time.hour, minute: time.minute }))
}
