import { useMemo, type CSSProperties } from 'react'
import './SegmentedControl.css'
import { SegmentButton } from './SegmentButton'
import type { SegmentedControlProps } from './SegmentedControl.types'

/**
 * Interrupteur de sélection : un groupe de segments dont un seul est actif.
 * Couvre les sélecteurs de plage temporelle, filtres exclusifs, et tout choix
 * unique parmi N options visibles côte à côte.
 *
 * Deux variantes : `track` (piste segmentée) et `pills` (pastilles).
 * Accessibilité : `role="radiogroup"` + segments `role="radio"` / `aria-checked`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'track',
  accentColor,
  ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  const activeStyle = useMemo<CSSProperties | undefined>(
    () => (accentColor ? { background: accentColor, borderColor: accentColor } : undefined),
    [accentColor],
  )

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`segmented segmented--${variant} ${className}`.trim()}>
      {options.map(opt => (
        <SegmentButton
          key={opt.value}
          value={opt.value}
          label={opt.label}
          active={opt.value === value}
          activeStyle={activeStyle}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}
