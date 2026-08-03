// Une proposition de verbe d'action pour l'étape 6 (PW-4).
//
// Le jeu de propositions est FIXE : il vient de la configuration, dans son ordre, et
// n'est jamais réordonné ni filtré selon ce qui a été saisi.

import { useCallback } from 'react'
import { Chip } from '@ui/Chip'

/** Une proposition, telle que la configuration la déclare. */
export interface MeasureVerbOption {
  /** Clé i18n, qui sert aussi d'identifiant stable. */
  readonly code: string
  /** Libellé traduit. */
  readonly label: string
}

interface Props {
  option: MeasureVerbOption
  selected: boolean
  onSelect: (code: string) => void
}

export function MeasureVerbChip({ option, selected, onSelect }: Props) {
  const handleClick = useCallback(() => onSelect(option.code), [onSelect, option.code])
  return <Chip label={option.label} selectable selected={selected} onClick={handleClick} />
}
