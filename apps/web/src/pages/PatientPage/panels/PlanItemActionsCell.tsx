// Actions d'une ligne d'item : réordonner, supprimer (PW-2).
//
// Le réordonnancement passe par deux boutons plutôt que par un glisser : un glissement
// n'est atteignable ni au clavier ni au lecteur d'écran, et l'accessibilité AA est une
// exigence de l'Epic (P-16). Les deux boutons écrivent le même `sort_order`.
//
// **Aucune suppression sans annulation possible** : ce bouton retire la ligne, et le
// bandeau du panneau propose de la remettre, identifiant compris.

import { useCallback } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Button } from '@ui/Button'
import type { SafetyPlanItem } from '@services/safetyPlanItemsService'

interface Props {
  item: SafetyPlanItem
  /** Faux quand l'item est déjà en tête de son étape. */
  canMoveUp: boolean
  /** Faux quand l'item est déjà en queue de son étape. */
  canMoveDown: boolean
  /** Libellés déjà traduits, chacun nommant l'item pour être compris hors contexte. */
  labels: { moveUp: string; moveDown: string; delete: string }
  onMove: (item: SafetyPlanItem, direction: 'up' | 'down') => void
  onDelete: (item: SafetyPlanItem) => void
}

export function PlanItemActionsCell({ item, canMoveUp, canMoveDown, labels, onMove, onDelete }: Props) {
  const handleUp = useCallback(() => onMove(item, 'up'), [onMove, item])
  const handleDown = useCallback(() => onMove(item, 'down'), [onMove, item])
  const handleDelete = useCallback(() => onDelete(item), [onDelete, item])

  return (
    <div className="plan-editor__row-actions">
      <Button
        variant="ghost"
        size="xs"
        icon={<ArrowUp size={14} />}
        disabled={!canMoveUp}
        aria-label={`${labels.moveUp} : ${item.text}`}
        onClick={handleUp}
      />
      <Button
        variant="ghost"
        size="xs"
        icon={<ArrowDown size={14} />}
        disabled={!canMoveDown}
        aria-label={`${labels.moveDown} : ${item.text}`}
        onClick={handleDown}
      />
      <Button
        variant="ghost"
        size="xs"
        icon={<Trash2 size={14} />}
        aria-label={`${labels.delete} : ${item.text}`}
        onClick={handleDelete}
      />
    </div>
  )
}
