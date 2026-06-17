import { memo, useCallback } from 'react'
import { MED_ROW_STYLE, MED_EFFECT_LABEL_STYLE } from './medCardStyles'

export interface AnchorToggleRowProps {
  anchorKey: string
  checked: boolean
  label: string
  onToggle: (key: string) => void
}

/** Ligne « ancre suivie » du sélecteur « Rythmes & régularité ». Mémoïsée : callback figé. */
function AnchorToggleRowComponent({ anchorKey, checked, label, onToggle }: AnchorToggleRowProps) {
  const handleToggle = useCallback(() => onToggle(anchorKey), [anchorKey, onToggle])

  return (
    <label style={MED_ROW_STYLE}>
      <input type="checkbox" checked={checked} onChange={handleToggle} />
      <span style={MED_EFFECT_LABEL_STYLE}>{label}</span>
    </label>
  )
}

export const AnchorToggleRow = memo(AnchorToggleRowComponent)
