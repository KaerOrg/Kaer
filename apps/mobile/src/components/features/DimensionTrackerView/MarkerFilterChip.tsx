import React, { useCallback } from 'react'
import { Chip } from '@ui/Chip'
import type { MarkerType } from '../../../lib/database'

// Puce de filtre de la liste de repères — leaf mémoïsé à callback stable.
// `value = null` = filtre « Tout ».

export interface MarkerFilterChipProps {
  readonly value: MarkerType | null
  readonly label: string
  readonly color: string
  readonly selected: boolean
  readonly onSelect: (value: MarkerType | null) => void
}

export const MarkerFilterChip = React.memo(function MarkerFilterChip({
  value, label, color, selected, onSelect,
}: MarkerFilterChipProps) {
  const handlePress = useCallback(() => onSelect(value), [onSelect, value])
  return <Chip label={label} selected={selected} color={color} size="sm" onPress={handlePress} />
})
