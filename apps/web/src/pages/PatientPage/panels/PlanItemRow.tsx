// Une ligne d'item dans l'éditeur du plan (PW-2).
//
// **Un item sans numéro n'est pas une erreur** : ni validation bloquante, ni rouge.
// La mention est neutre et dit la CONSÉQUENCE côté patient (ni bouton d'appel, ni
// message) plutôt que de reprocher une absence. Certains items sont des lieux, ou des
// personnes qu'on va voir.

import { useCallback } from 'react'
import { Button } from '@ui/Button'
import { isReachable } from './safetyPlanEditorLogic'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

interface Props {
  item: SafetyPlanItem
  /** Mention neutre affichée quand l'item ne porte pas de numéro, déjà traduite. */
  noPhoneLabel: string
  deleteLabel: string
  onDelete: (item: SafetyPlanItem) => void
}

export function PlanItemRow({ item, noPhoneLabel, deleteLabel, onDelete }: Props) {
  const handleDelete = useCallback(() => onDelete(item), [onDelete, item])

  return (
    <li className="plan-editor__item" data-testid={`plan-item-${item.id}`}>
      <span className="plan-editor__item-text">{item.text}</span>
      {isReachable(item) ? null : <span className="plan-editor__item-note">{noPhoneLabel}</span>}
      <Button variant="ghost" size="xs" onClick={handleDelete} aria-label={`${deleteLabel} : ${item.text}`}>
        {deleteLabel}
      </Button>
    </li>
  )
}
