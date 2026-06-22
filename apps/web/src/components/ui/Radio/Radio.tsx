import { useCallback, type MouseEvent } from 'react'
import './Radio.css'
import type { RadioProps } from './Radio.types'

const DEFAULT_COLOR = 'var(--color-primary)'

/**
 * Sélecteur à choix exclusif — pendant web du `Radio` mobile. Deux habillages via
 * `variant` : `list` (rond + label + sous-label) ou `pills` (pilules en ligne).
 *
 * Tout choix mono-sélection passe par ce primitive — jamais de `<button>` ad hoc.
 * Pour un choix exclusif compact en barre segmentée → `SegmentedControl`.
 */
export function Radio({ options, value, onChange, variant = 'list', color = DEFAULT_COLOR, className, ...rest }: RadioProps) {
  const testId = rest['data-testid']

  // Handler stable : la valeur cliquée est lue dans data-value (zéro arrow inline par option).
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const v = e.currentTarget.dataset.value
      if (v != null) onChange(v)
    },
    [onChange],
  )

  if (variant === 'pills') {
    return (
      <div className={`radio radio--pills${className ? ` ${className}` : ''}`} role="radiogroup" data-testid={testId}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={`radio__pill${active ? ' radio__pill--active' : ''}`}
              style={active ? { background: color, borderColor: color } : undefined}
              onClick={handleClick}
              data-value={opt.value}
              role="radio"
              aria-checked={active}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={`radio radio--cards${className ? ` ${className}` : ''}`} role="radiogroup" data-testid={testId}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={`radio__card${active ? ' radio__card--active' : ''}`}
              style={active ? { background: color, borderColor: color } : undefined}
              onClick={handleClick}
              data-value={opt.value}
              role="radio"
              aria-checked={active}
            >
              {opt.badge != null ? <span className="radio__card-badge">{opt.badge}</span> : null}
              <span className="radio__card-label">{opt.label}</span>
              {opt.sublabel ? <span className="radio__card-detail">{opt.sublabel}</span> : null}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`radio radio--list${className ? ` ${className}` : ''}`} role="radiogroup" data-testid={testId}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            className="radio__row"
            onClick={handleClick}
            data-value={opt.value}
            role="radio"
            aria-checked={active}
          >
            <span className={`radio__dot${active ? ' radio__dot--active' : ''}`} style={active ? { borderColor: color } : undefined}>
              {active ? <span className="radio__dot-inner" style={{ background: color }} /> : null}
            </span>
            <span className="radio__text">
              <span className="radio__label">{opt.label}</span>
              {opt.sublabel ? <span className="radio__sublabel">{opt.sublabel}</span> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
