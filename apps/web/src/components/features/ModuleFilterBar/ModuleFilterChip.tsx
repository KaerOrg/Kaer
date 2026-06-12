import { memo, useCallback } from 'react'
import { Chip } from '../../ui/Chip'

interface ModuleFilterChipProps {
  dimensionId: string
  tagId: string
  label: string
  selected: boolean
  onToggle: (dimensionId: string, tagId: string) => void
}

/**
 * Une puce de filtre sélectionnable. Mémoïsée + callback stable pour éviter de
 * recréer un handler par puce à chaque rendu de la barre.
 */
function ModuleFilterChipBase({ dimensionId, tagId, label, selected, onToggle }: ModuleFilterChipProps) {
  const handleClick = useCallback(() => onToggle(dimensionId, tagId), [onToggle, dimensionId, tagId])
  return <Chip selectable selected={selected} label={label} onClick={handleClick} />
}

export const ModuleFilterChip = memo(ModuleFilterChipBase)
