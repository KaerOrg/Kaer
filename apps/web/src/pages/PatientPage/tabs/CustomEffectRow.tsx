import { memo, useCallback, useMemo, type CSSProperties } from 'react'
import type { TrackedEffect } from '../../../lib/sideEffectsCatalog'
import { MED_ROW_STYLE, medDotStyle } from './medCardStyles'

const CUSTOM_DELETE_STYLE: CSSProperties = {
  fontSize: 11,
  color: '#DC2626',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}
const CUSTOM_LABEL_STYLE: CSSProperties = { flex: 1, fontSize: 13, color: '#111827' }
const DEFAULT_CUSTOM_COLOR = '#8B5CF6'

export interface CustomEffectRowProps {
  effect: TrackedEffect
  deleteLabel: string
  onRemove: (key: string) => void
}

/** Ligne « effet personnalisé » du sélecteur (supprimable). Mémoïsée : callback figé. */
function CustomEffectRowComponent({ effect, deleteLabel, onRemove }: CustomEffectRowProps) {
  const handleRemove = useCallback(() => onRemove(effect.key), [effect.key, onRemove])
  const color = effect.color ?? DEFAULT_CUSTOM_COLOR

  const rowStyle = useMemo<CSSProperties>(
    () => ({ ...MED_ROW_STYLE, cursor: 'default', borderLeft: `3px solid ${color}` }),
    [color]
  )

  return (
    <div style={rowStyle}>
      <span style={medDotStyle(color)} />
      <span style={CUSTOM_LABEL_STYLE}>{effect.label}</span>
      <button type="button" onClick={handleRemove} style={CUSTOM_DELETE_STYLE}>
        {deleteLabel}
      </button>
    </div>
  )
}

export const CustomEffectRow = memo(CustomEffectRowComponent)
