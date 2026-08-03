// Cellule « nature de l'item » : une personne qu'on joint, ou un lieu où l'on va (PW-3).
//
// L'étape 3 (« Où aller, qui voir ») mélange les deux : le drapeau `contactable`, porté
// par l'étape entière, ne savait pas le dire. `kind` le dit au niveau de l'item, et
// surcharge le défaut d'étape.
//
// Conformité MDR 2017/745 : **rien n'est présélectionné et rien n'est déduit du texte**.
// « Yasmine » ne devient pas une personne, « le parc » ne devient pas un lieu. Tant que
// le praticien n'a pas choisi en consultation, aucun segment n'est actif.

import { useCallback } from 'react'
import { SegmentedControl } from '@ui/SegmentedControl'
import type { SegmentOption } from '@ui/SegmentedControl'
import type { PlanItemKind, SafetyPlanItem } from '@services/safetyPlanItemsService'

interface Props {
  item: SafetyPlanItem
  /** Les deux natures, libellés déjà traduits, dans l'ordre de la configuration. */
  options: readonly SegmentOption<PlanItemKind>[]
  ariaLabel: string
  onPatch: (item: SafetyPlanItem, patch: { kind: PlanItemKind }) => void
}

export function PlanItemKindCell({ item, options, ariaLabel, onPatch }: Props) {
  const handleChange = useCallback((kind: PlanItemKind) => onPatch(item, { kind }), [item, onPatch])

  return (
    <SegmentedControl
      options={options}
      value={item.kind}
      onChange={handleChange}
      variant="pills"
      ariaLabel={ariaLabel}
    />
  )
}
