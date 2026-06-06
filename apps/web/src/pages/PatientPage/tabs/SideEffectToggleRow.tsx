import { memo, useCallback } from 'react'
import type { SideEffectCatalogItem } from '../../../lib/sideEffectsCatalog'
import { MED_ROW_STYLE, MED_EFFECT_LABEL_STYLE, medDotStyle } from './medCardStyles'

export interface SideEffectToggleRowProps {
  item: SideEffectCatalogItem
  checked: boolean
  label: string
  onToggle: (key: string) => void
}

/** Ligne « effet suivi » du sélecteur (catalogue fixe). Mémoïsée : callback figé. */
function SideEffectToggleRowComponent({ item, checked, label, onToggle }: SideEffectToggleRowProps) {
  const handleToggle = useCallback(() => onToggle(item.key), [item.key, onToggle])

  return (
    <label style={MED_ROW_STYLE}>
      <input type="checkbox" checked={checked} onChange={handleToggle} />
      <span style={medDotStyle(item.color)} />
      <span style={MED_EFFECT_LABEL_STYLE}>{label}</span>
    </label>
  )
}

export const SideEffectToggleRow = memo(SideEffectToggleRowComponent)
