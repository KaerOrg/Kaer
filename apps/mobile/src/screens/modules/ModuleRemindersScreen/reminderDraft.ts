// Logique pure de l'écran « Rappels » : brouillon local des rappels, avant
// enregistrement. Le patient peut décaler l'heure, changer les jours, mettre en
// pause et supprimer sans qu'un aller-retour réseau parte à chaque geste.
//
// Rien ici n'est conditionnel à une donnée de saisie : un rappel est un horaire, pas
// une réaction à ce que le patient a écrit (MDR).

import type { NotificationRoutine } from '@services/notificationService'

/** Un rappel tel que l'écran le manipule, avant enregistrement. */
export interface ReminderDraft {
  /** `null` pour un rappel ajouté et pas encore enregistré. */
  readonly id: string | null
  /** Clé stable de rendu, y compris avant l'existence d'un id serveur. */
  readonly key: string
  /** Heure affichée et enregistrée, « HH:MM ». */
  readonly time: string
  /** Jours ISO retenus (1 = lundi … 7 = dimanche), triés. */
  readonly days: number[]
  readonly paused: boolean
  /** Heure posée par le praticien, gardée pour savoir s'il y a décalage. */
  readonly baseTime: string
}

export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const
/** Heure d'un rappel ajouté par le patient : début de soirée, neutre. */
export const DEFAULT_NEW_TIME = '18:00'

export function toDraft(routine: NotificationRoutine): ReminderDraft {
  return {
    id: routine.id,
    key: routine.id,
    time: routine.patient_time_override ?? routine.time_of_day,
    days: [...routine.days_of_week].sort((a, b) => a - b),
    paused: routine.patient_paused,
    baseTime: routine.time_of_day,
  }
}

/** Rappel ajouté par le patient : tous les jours, pas encore enregistré. */
export function newDraft(key: string, time: string = DEFAULT_NEW_TIME): ReminderDraft {
  return { id: null, key, time, days: [...ALL_DAYS], paused: false, baseTime: time }
}

/**
 * Bascule un jour. Un rappel doit garder AU MOINS un jour : sans jour, il ne
 * partirait jamais, ce qui est une pause déguisée. Le dernier jour n'est donc pas
 * retirable, la pause existe pour ça.
 */
export function toggleDay(draft: ReminderDraft, day: number): ReminderDraft {
  const selected = draft.days.includes(day)
  if (selected && draft.days.length === 1) return draft
  const days = selected
    ? draft.days.filter(d => d !== day)
    : [...draft.days, day].sort((a, b) => a - b)
  return { ...draft, days }
}

/** L'heure diffère-t-elle de celle posée en séance ? */
export function isShifted(draft: ReminderDraft): boolean {
  return draft.id != null && draft.time !== draft.baseTime
}

/** Libellé de la fréquence : « tous les jours », ou la liste des jours retenus. */
export function frequencyLabel(
  draft: ReminderDraft,
  everyDayLabel: string,
  dayLabels: readonly string[],
): string {
  if (draft.days.length === ALL_DAYS.length) return everyDayLabel
  return draft.days.map(d => dayLabels[d - 1] ?? '').filter(Boolean).join(', ')
}
