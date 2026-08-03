// Le patch qu'une cellule éditable remonte : un seul champ à la fois (PW-3).
//
// Pourquoi un type explicite plutôt qu'un `Record<string, string | null>` : le TEXTE
// d'un item ne peut pas devenir `null`. Un item sans texte n'a plus d'existence, et
// l'effacer par une sortie de champ serait une suppression déguisée, sans annulation
// possible. Les trois précisions, elles, redeviennent `null` une fois vidées.

import type { PlanItemKind } from '@services/safetyPlanItemsService'

/** Les champs texte d'un item qu'une cellule sait éditer. */
export type EditableTextField = 'text' | 'role' | 'note' | 'phone'

export interface PlanItemPatch {
  text?: string
  role?: string | null
  note?: string | null
  phone?: string | null
  kind?: PlanItemKind
}

/**
 * Patch d'un champ texte, à partir de la valeur saisie (déjà élaguée).
 *
 * Un `switch` exhaustif plutôt qu'une clé calculée : `{ [field]: value }` produirait un
 * index signature qui ferait passer `text: null` au compilateur.
 */
export function buildTextPatch(field: EditableTextField, value: string): PlanItemPatch {
  const nullable = value === '' ? null : value
  switch (field) {
    case 'text': return { text: value }
    case 'role': return { role: nullable }
    case 'note': return { note: nullable }
    case 'phone': return { phone: nullable }
  }
}
