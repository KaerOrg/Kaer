// Logique pure de `send-notifications` : ce qui part dans le push, et pour qui.
//
// ── Invariant MDR 2017/745 : le rappel est NEUTRE et INCONDITIONNEL ──────────
//
// Le corps de la notification est une CONSTANTE. Il ne dépend d'aucune donnée saisie
// par le patient, d'aucun score, d'aucun seuil, et d'aucun texte écrit par le
// praticien. Deux patients suivis par deux praticiens différents, avec deux consignes
// différentes, reçoivent exactement le même corps.
//
// La consigne du praticien (`practitioner_note`) existe toujours, mais elle s'affiche
// EN TÊTE DU MODULE, à l'ouverture, pas dans le push. Un rappel dont le texte
// dépendrait d'une consigne clinique ne serait plus un rappel neutre au sens MDR, et
// cela vaudrait pour les vingt modules, pas seulement celui qui l'a écrite.
//
// Ne jamais interpoler quoi que ce soit dans ces deux constantes.

export const NOTIFICATION_TITLE = 'Kær'
export const NOTIFICATION_BODY = 'Vous avez un exercice à faire aujourd\'hui.'

export interface DueRoutine {
  readonly id: string
  readonly patient_id: string
  readonly days_of_week: number[]
  readonly time_of_day: string
  readonly patient_time_override: string | null
}

export interface PushMessage {
  readonly title: string
  readonly body: string
}

/**
 * Contenu du rappel. La routine n'est PAS lue : la signature la reçoit pour que
 * l'appelant n'ait pas à s'en souvenir, et le corps du message reste constant.
 * Si un jour quelqu'un veut y injecter une donnée, il devra modifier cette
 * fonction et faire tomber son test, ce qui est exactement le but.
 */
export function buildPushMessage(_routine: DueRoutine): PushMessage {
  return { title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }
}

/** L'heure à laquelle le rappel part vraiment : le décalage du patient prime. */
export function effectiveTime(routine: DueRoutine): string {
  return routine.patient_time_override ?? routine.time_of_day
}

/** Routines dues à l'instant donné (jour ISO + heure « HH:MM »). */
export function selectDueRoutines<T extends DueRoutine>(
  routines: readonly T[],
  isoDay: number,
  hhmm: string,
): T[] {
  return routines.filter(r => r.days_of_week.includes(isoDay) && effectiveTime(r) === hhmm)
}
