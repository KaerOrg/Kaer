import { memo, useCallback, useMemo, type CSSProperties } from 'react'
import type { TrackedEffect } from '../../../lib/sideEffectsCatalog'
import { Button } from '../../../components/ui/Button'
import { MED_ROW_STYLE, medDotStyle } from './medCardStyles'

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
      <Button type="button" variant="ghost" category="danger" size="xs" onClick={handleRemove}>
        {deleteLabel}
      </Button>
    </div>
  )
}

export const CustomEffectRow = memo(CustomEffectRowComponent)
