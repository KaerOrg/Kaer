import { memo, useCallback, type CSSProperties } from 'react'

export interface SegmentButtonProps<T extends string = string> {
  value: T
  label: string
  active: boolean
  /** Style appliqué uniquement quand le segment est actif (couleur d'accent dynamique). */
  activeStyle?: CSSProperties
  onSelect: (value: T) => void
}

/** Un segment de `SegmentedControl`. Mémoïsé : callback figé via `useCallback` (zéro déclaration inline). */
function SegmentButtonComponent<T extends string>({ value, label, active, activeStyle, onSelect }: SegmentButtonProps<T>) {
  const handleClick = useCallback(() => onSelect(value), [value, onSelect])

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={`segmented__btn${active ? ' segmented__btn--active' : ''}`}
      style={active ? activeStyle : undefined}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}

// `memo` efface la généricité ; le cast la restaure sans recourir à `any`/`unknown`.
export const SegmentButton = memo(SegmentButtonComponent) as typeof SegmentButtonComponent
