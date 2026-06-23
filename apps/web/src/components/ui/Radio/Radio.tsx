import { useCallback, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import './Radio.css'
import type { RadioProps } from './Radio.types'

const DEFAULT_COLOR = 'var(--color-primary)'

/**
 * Sélecteur à choix exclusif — pendant web du `Radio` mobile. Deux habillages via
 * `variant` : `list` (rond + label + sous-label) ou `pills` (pilules en ligne).
 *
 * `onChange` rend le sélecteur interactif ; absent → rendu non interactif
 * (options en `<span>`, sans `role`), pour un aperçu / affichage en lecture seule.
 * Tout choix mono-sélection passe par ce primitive — jamais de `<button>` ad hoc.
 * Pour un choix exclusif compact en barre segmentée → `SegmentedControl`.
 */
export function Radio({ options, value, onChange, variant = 'list', color = DEFAULT_COLOR, className, ...rest }: RadioProps) {
  const testId = rest['data-testid']
  const interactive = onChange != null

  // Handler stable : la valeur cliquée est lue dans data-value (zéro arrow inline par option).
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const v = e.currentTarget.dataset.value
      if (v != null) onChange?.(v)
    },
    [onChange],
  )

  // Enrobe le contenu d'une option : `<button role=radio>` si interactif, sinon
  // `<span>` non interactif (même habillage, lecture seule).
  const renderOption = (key: string, active: boolean, optClass: string, optStyle: CSSProperties | undefined, content: ReactNode) =>
    interactive ? (
      <button
        key={key}
        type="button"
        className={optClass}
        style={optStyle}
        onClick={handleClick}
        data-value={key}
        role="radio"
        aria-checked={active}
      >
        {content}
      </button>
    ) : (
      <span key={key} className={optClass} style={optStyle} aria-checked={active}>
        {content}
      </span>
    )

  const groupRole = interactive ? 'radiogroup' : undefined

  if (variant === 'pills') {
    return (
      <div className={`radio radio--pills${className ? ` ${className}` : ''}`} role={groupRole} data-testid={testId}>
        {options.map(opt => {
          const active = value === opt.value
          return renderOption(
            opt.value,
            active,
            `radio__pill${active ? ' radio__pill--active' : ''}`,
            active ? { background: color, borderColor: color } : undefined,
            opt.label,
          )
        })}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={`radio radio--cards${className ? ` ${className}` : ''}`} role={groupRole} data-testid={testId}>
        {options.map(opt => {
          const active = value === opt.value
          return renderOption(
            opt.value,
            active,
            `radio__card${active ? ' radio__card--active' : ''}`,
            active ? { background: color, borderColor: color } : undefined,
            <>
              {opt.badge != null ? <span className="radio__card-badge">{opt.badge}</span> : null}
              <span className="radio__card-label">{opt.label}</span>
              {opt.sublabel ? <span className="radio__card-detail">{opt.sublabel}</span> : null}
            </>,
          )
        })}
      </div>
    )
  }

  return (
    <div className={`radio radio--list${className ? ` ${className}` : ''}`} role={groupRole} data-testid={testId}>
      {options.map(opt => {
        const active = value === opt.value
        return renderOption(
          opt.value,
          active,
          'radio__row',
          undefined,
          <>
            <span className={`radio__dot${active ? ' radio__dot--active' : ''}`} style={active ? { borderColor: color } : undefined}>
              {active ? <span className="radio__dot-inner" style={{ background: color }} /> : null}
            </span>
            <span className="radio__text">
              <span className="radio__label">{opt.label}</span>
              {opt.sublabel ? <span className="radio__sublabel">{opt.sublabel}</span> : null}
            </span>
          </>,
        )
      })}
    </div>
  )
}
