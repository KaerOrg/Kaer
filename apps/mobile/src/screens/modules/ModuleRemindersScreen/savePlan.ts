// Ce qu'il faut écrire pour passer de l'état chargé à l'état affiché : logique pure,
// testée, sans réseau. L'écran laisse le patient tout bouger localement, puis un seul
// « Enregistrer » applique le minimum d'écritures.

import type { NotificationRoutine } from '@services/notificationService'
import type { ReminderDraft } from './reminderDraft'

export interface SavePlan {
  /** Rappels à créer (ajoutés par le patient, sans id serveur). */
  readonly created: ReminderDraft[]
  /** Rappels supprimés : ids présents au chargement, absents à l'écran. */
  readonly deleted: string[]
  /** Heure changée : `null` remet l'heure posée par le praticien. */
  readonly timeChanged: { readonly id: string; readonly time: string | null }[]
  readonly daysChanged: { readonly id: string; readonly days: number[] }[]
  readonly pauseChanged: { readonly id: string; readonly paused: boolean }[]
}

function sameDays(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((d, i) => d === b[i])
}

/**
 * Diff entre les routines chargées et les brouillons à l'écran.
 *
 * Remettre l'heure posée par le praticien efface l'override (`null`) plutôt que
 * d'enregistrer la même valeur : la ligne redevient « non décalée », et le praticien
 * cesse de lire « décalé par le patient » pour un décalage qui n'existe plus.
 */
export function buildSavePlan(
  loaded: readonly NotificationRoutine[],
  drafts: readonly ReminderDraft[],
): SavePlan {
  const byId = new Map(loaded.map(r => [r.id, r]))
  const keptIds = new Set(drafts.map(d => d.id).filter((id): id is string => id != null))

  const plan: SavePlan = {
    created: drafts.filter(d => d.id == null),
    deleted: loaded.map(r => r.id).filter(id => !keptIds.has(id)),
    timeChanged: [],
    daysChanged: [],
    pauseChanged: [],
  }

  for (const draft of drafts) {
    if (draft.id == null) continue
    const routine = byId.get(draft.id)
    if (!routine) continue

    const currentTime = routine.patient_time_override ?? routine.time_of_day
    if (draft.time !== currentTime) {
      plan.timeChanged.push({
        id: draft.id,
        time: draft.time === routine.time_of_day ? null : draft.time,
      })
    }

    if (!sameDays(draft.days, [...routine.days_of_week].sort((a, b) => a - b))) {
      plan.daysChanged.push({ id: draft.id, days: draft.days })
    }

    if (draft.paused !== routine.patient_paused) {
      plan.pauseChanged.push({ id: draft.id, paused: draft.paused })
    }
  }

  return plan
}

/** Y a-t-il quoi que ce soit à écrire ? Sinon « Enregistrer » ne part pas. */
export function isEmptyPlan(plan: SavePlan): boolean {
  return plan.created.length === 0
    && plan.deleted.length === 0
    && plan.timeChanged.length === 0
    && plan.daysChanged.length === 0
    && plan.pauseChanged.length === 0
}
