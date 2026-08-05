import { useCallback } from 'react'
import { Chip } from '../../../components/ui/Chip'

interface Props {
  techniqueKey: string
  label: string
  selected: boolean
  /** Reçoit la clé : le parent n'a pas à créer une lambda par puce. */
  onSelect: (key: string) => void
}

/** Puce de filtre d'une technique dans l'onglet Données. */
export function BreathingTechniqueChip({ techniqueKey, label, selected, onSelect }: Props) {
  const handleClick = useCallback(() => onSelect(techniqueKey), [onSelect, techniqueKey])
  return <Chip label={label} selectable selected={selected} onClick={handleClick} />
}
