// Une proposition de verbe d'action pour l'étape 6 (P-13).
//
// Le jeu de propositions est FIXE et vient de la configuration : il n'est jamais
// réordonné, filtré ni complété selon les saisies passées du patient. Chaque puce porte
// son propre code et rappelle un callback stable du parent, plutôt qu'une lambda par
// puce qui casserait la mémoïsation.

import React, { useCallback } from 'react'
import { Chip } from '@ui/Chip'

/** Une proposition, telle que la config la déclare. */
export interface MeasureVerbOption {
  /** Clé i18n, qui sert aussi d'identifiant stable dans la liste. */
  code: string
  /** Libellé traduit. */
  label: string
}

export interface MeasureVerbChipProps {
  option: MeasureVerbOption
  selected: boolean
  onSelect: (code: string) => void
}

export const MeasureVerbChip = React.memo(function MeasureVerbChip({
  option, selected, onSelect,
}: MeasureVerbChipProps) {
  const handlePress = useCallback(() => onSelect(option.code), [onSelect, option.code])
  return (
    <Chip
      label={option.label}
      selected={selected}
      onPress={handlePress}
      testID={`measure-verb-${option.code}`}
    />
  )
})
