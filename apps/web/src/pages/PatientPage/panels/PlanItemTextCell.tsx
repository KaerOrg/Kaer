// Une cellule éditable du tableau d'items (PW-3).
//
// Champ **non contrôlé** : sa valeur ne conditionne rien dans l'UI, elle n'est lue
// qu'à la validation. Un `useState` par cellule re-rendrait la table entière à chaque
// frappe du praticien.
//
// L'enregistrement se fait à la sortie du champ, et seulement si la valeur a changé :
// traverser un tableau au clavier ne doit pas écrire six fois dans le plan.

import { useCallback, useRef, type FocusEvent } from 'react'
import { InputField } from '@ui/InputField'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'
import { buildTextPatch, type EditableTextField, type PlanItemPatch } from './planItemPatch'

interface Props {
  item: SafetyPlanItem
  field: EditableTextField
  /** Libellé accessible de la cellule, déjà traduit (l'en-tête de colonne porte le visible). */
  ariaLabel: string
  onPatch: (item: SafetyPlanItem, patch: PlanItemPatch) => void
}

export function PlanItemTextCell({ item, field, ariaLabel, onPatch }: Props) {
  const initial = item[field] ?? ''
  // La valeur de départ sert de point de comparaison à la sortie du champ. Une ref,
  // parce qu'elle ne change rien à l'affichage, la relire n'a pas à re-rendre.
  const initialRef = useRef(initial)

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const next = e.target.value.trim()
    if (next === initialRef.current) return

    // Un item sans texte n'a plus d'existence : on ne le vide pas par une sortie de
    // champ. Le champ reprend sa valeur, et la suppression reste un geste explicite,
    // annulable.
    if (field === 'text' && next === '') {
      e.target.value = initialRef.current
      return
    }

    initialRef.current = next
    onPatch(item, buildTextPatch(field, next))
  }, [item, field, onPatch])

  return (
    <InputField
      // `key` sur la valeur serveur : quand le patient modifie l'item depuis son
      // téléphone, le champ non contrôlé doit repartir de la valeur reçue.
      key={initial}
      defaultValue={initial}
      aria-label={ariaLabel}
      onBlur={handleBlur}
      className="plan-editor__cell-input"
    />
  )
}
