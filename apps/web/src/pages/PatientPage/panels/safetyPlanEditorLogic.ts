// ─── Logique pure de l'éditeur du plan de sécurité (PW-2) ───────────────────
//
// Isolée du composant et testée à part, sur le patron de `crisisLogic.ts`.
//
// Conformité MDR 2017/745 : ces fonctions comptent et regroupent, elles ne concluent
// jamais. **Aucun pourcentage de complétion**, aucun score, aucun jugement sur l'état
// du plan : « 3 étapes remplies sur 6 » est un décompte, « plan complété à 50 % » est
// une évaluation. La nuance n'est pas cosmétique, c'est la ligne de la règle d'or.

import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

/** Une étape du plan, avec ce qu'il faut pour la lister à gauche. */
export interface StepSummary {
  /** `step_1` … `step_6`. */
  readonly sectionId: string
  /** Libellé traduit de l'étape. */
  readonly label: string
  /** Nombre d'items. Un décompte, jamais un taux. */
  readonly count: number
  /** Vrai quand l'étape n'a rien. C'est le seul endroit d'où l'on voit ce qui manque. */
  readonly isEmpty: boolean
}

/** Items regroupés par étape, dans l'ordre d'affichage de chaque étape. */
export function groupBySection(items: readonly SafetyPlanItem[]): Map<string, SafetyPlanItem[]> {
  const map = new Map<string, SafetyPlanItem[]>()
  for (const item of items) {
    const list = map.get(item.section_id) ?? []
    list.push(item)
    map.set(item.section_id, list)
  }
  for (const list of map.values()) list.sort((a, b) => a.sort_order - b.sort_order)
  return map
}

/**
 * Résumé des six étapes, dans l'ordre de la configuration.
 *
 * L'ordre vient des étapes déclarées, jamais des items : une étape vide doit apparaître
 * à sa place, c'est précisément ce qu'on veut voir.
 */
export function buildStepSummaries(
  orderedSections: readonly { sectionId: string; label: string }[],
  items: readonly SafetyPlanItem[],
): StepSummary[] {
  const grouped = groupBySection(items)
  return orderedSections.map(({ sectionId, label }) => {
    const count = grouped.get(sectionId)?.length ?? 0
    return { sectionId, label, count, isEmpty: count === 0 }
  })
}

/** Rang du prochain item d'une étape : à la suite, jamais en tête. */
export function nextSortOrder(items: readonly SafetyPlanItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.sort_order + 1), 0)
}

/**
 * Un item est-il joignable ?
 *
 * **Un item sans numéro n'est pas une erreur** : ni validation bloquante, ni rouge. Il
 * s'affiche avec une mention neutre, et l'interface explique la conséquence côté
 * patient (ni bouton d'appel, ni message). Certains items du plan sont des lieux, ou
 * des personnes qu'on va voir.
 */
export function isReachable(item: Pick<SafetyPlanItem, 'phone'>): boolean {
  return item.phone != null && item.phone.trim() !== ''
}
