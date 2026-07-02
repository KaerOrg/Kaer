import React, { useCallback } from 'react'
import { Chip } from '@ui/Chip'

export interface PickChipProps {
  id: string
  label: string
  selected: boolean
  testID: string
  onPick: (id: string) => void
}

// Chip sélectionnable mémoïsé pour les listes du formulaire d'activité
// (activités co-construites + suggestions) : callback stable par item,
// aucune closure recréée dans le map du parent.
export const PickChip = React.memo(function PickChip({ id, label, selected, testID, onPick }: PickChipProps) {
  const handlePress = useCallback(() => onPick(id), [onPick, id])
  return <Chip label={label} selected={selected} onPress={handlePress} testID={testID} />
})
