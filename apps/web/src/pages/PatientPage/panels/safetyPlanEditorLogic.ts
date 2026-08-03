// ─── Logique pure de l'éditeur du plan de sécurité (PW-2, PW-3, PW-5) ───────
//
// Isolée du composant et testée à part, sur le patron de `crisisLogic.ts`.
//
// Conformité MDR 2017/745 : ces fonctions comptent, regroupent et réordonnent, elles ne
// concluent jamais. **Aucun pourcentage de complétion**, aucun score, aucun jugement sur
// l'état du plan : « 3 étapes remplies sur 6 » est un décompte, « plan complété à 50 % »
// est une évaluation. La nuance n'est pas cosmétique, c'est la ligne de la règle d'or.
//
// **Aucune date n'est comparée à aujourd'hui.** Ni ici ni ailleurs : le plan n'a pas
// d'ancienneté surveillée, pas de badge « à revoir », pas de relance. C'est le soignant
// qui décide quand il le revoit.

import { readStepColumns, type StepColumns } from '@kaer/shared'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

/** Une étape du plan, telle que la configuration la déclare. */
export interface PlanStep {
  /** `step_1` … `step_6`. */
  readonly sectionId: string
  /** Libellé traduit de l'étape. */
  readonly label: string
  /** `field_props` du `step_title` : d'où sortent les colonnes de l'étape. */
  readonly props: Readonly<Record<string, string>>
}

/** Une étape du plan, avec ce qu'il faut pour la lister à gauche. */
export interface StepSummary {
  readonly sectionId: string
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
 * Résumé des étapes, dans l'ordre de la configuration.
 *
 * L'ordre vient des étapes déclarées, jamais des items : une étape vide doit apparaître
 * à sa place, c'est précisément ce qu'on veut voir.
 */
export function buildStepSummaries(
  orderedSteps: readonly PlanStep[],
  items: readonly SafetyPlanItem[],
): StepSummary[] {
  const grouped = groupBySection(items)
  return orderedSteps.map(({ sectionId, label }) => {
    const count = grouped.get(sectionId)?.length ?? 0
    return { sectionId, label, count, isEmpty: count === 0 }
  })
}

/**
 * Décompte des étapes remplies : « 5 étapes remplies sur 6 ».
 *
 * Renvoie les deux nombres bruts, jamais leur rapport. Un composant qui recevrait un
 * ratio serait à un `Math.round(× 100)` d'afficher un pourcentage de complétion, et
 * « plan complété à 83 % » est une évaluation de l'état du patient.
 */
export function countFilledSteps(summaries: readonly StepSummary[]): { filled: number; total: number } {
  return { filled: summaries.filter(s => !s.isEmpty).length, total: summaries.length }
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

/** Colonnes de l'étape ouverte, déduites de sa configuration (PW-3). */
export function stepColumnsOf(step: PlanStep | undefined): StepColumns {
  return readStepColumns(step?.props ?? {})
}

/** Un rang à réécrire pour un item donné, produit par `reorderItems`. */
export interface SortOrderPatch {
  readonly id: string
  readonly sort_order: number
}

/**
 * Échange un item avec son voisin, et renvoie les **deux** rangs à réécrire.
 *
 * Renvoie une liste vide quand le déplacement n'a pas lieu d'être (item en tête qu'on
 * monte, en queue qu'on descend, item absent) : l'appelant n'a alors rien à persister.
 *
 * Réordonner porte sur les ITEMS d'une étape, jamais sur les étapes elles-mêmes :
 * l'ordre des six étapes est celui de l'instrument.
 */
export function reorderItems(
  items: readonly SafetyPlanItem[],
  id: string,
  direction: 'up' | 'down',
): SortOrderPatch[] {
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return []

  const neighbour = direction === 'up' ? index - 1 : index + 1
  if (neighbour < 0 || neighbour >= items.length) return []

  const reordered = [...items]
  reordered[index] = items[neighbour]
  reordered[neighbour] = items[index]

  // Les rangs sont réassignés d'après la POSITION, pas échangés deux à deux : des items
  // repris de `patient_entries` peuvent partager le même `sort_order` (tous à 0), et un
  // échange de valeurs identiques ne déplacerait rien. Seules les lignes dont le rang
  // change effectivement sont renvoyées : le cas courant reste deux écritures.
  return reordered
    .map((item, position) => ({ id: item.id, sort_order: position }))
    .filter((patch, position) => reordered[position].sort_order !== patch.sort_order)
}
