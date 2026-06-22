import { useCallback, type MouseEvent } from 'react'
import { Star, Sun } from 'lucide-react'
import './RatingSelector.css'
import { isBarProps, type RatingSelectorProps, type RatingSelectorSteppedProps } from './RatingSelector.types'

const DEFAULT_COLOR = 'var(--color-primary)'

function clampRatio(value: number, min: number, max: number): number {
  const ratio = max > min ? (value - min) / (max - min) : 0
  return Math.max(0, Math.min(1, ratio)) * 100
}

interface HeaderProps {
  label: string
  sublabel?: string
  value: number | null
  valueSuffix?: string
  color: string
}

function Header({ label, sublabel, value, valueSuffix, color }: HeaderProps) {
  return (
    <div className="rating-selector__header">
      <span className="rating-selector__dot" style={{ background: color }} />
      <div className="rating-selector__titles">
        <span className="rating-selector__label">{label}</span>
        {sublabel != null ? <span className="rating-selector__sublabel">{sublabel}</span> : null}
      </div>
      {value != null ? (
        <span className="rating-selector__value" style={{ color }}>
          {value}{valueSuffix ?? ''}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Sélecteur de note sur une échelle — pendant web 1-1 du `RatingSelector` mobile.
 * Quatre habillages pour un même besoin : pastilles chiffrées (`numbered`),
 * barre à segments (`track`), rangée d'icônes (`icon`), ou jauge continue (`bar`,
 * qui absorbe l'ancien `ValueBar`).
 *
 * Présentationnel : `onChange` rend les variantes discrètes interactives ; absent,
 * le composant est en lecture seule. Aucune interprétation (conforme MDR : affiche,
 * ne conclut pas).
 */
export function RatingSelector(props: RatingSelectorProps) {
  const color = props.color ?? DEFAULT_COLOR
  const showHeader = props.showHeader ?? true

  if (isBarProps(props)) {
    const { label, sublabel, value, min = 1, max = 10, lowHint, midHint, highHint, valueSuffix, layout = 'stacked', className } = props
    const pct = clampRatio(value, min, max)

    if (layout === 'inline') {
      return (
        <div className={`rating-selector rating-selector--bar-inline${className ? ` ${className}` : ''}`}>
          <span className="rating-selector__inline-label">{label}</span>
          <span className="rating-selector__bar-track">
            <span className="rating-selector__bar-fill" style={{ width: `${pct}%`, background: color }} />
          </span>
          <span className="rating-selector__value" style={{ color }}>{value}{valueSuffix ?? ''}</span>
        </div>
      )
    }

    return (
      <div className={`rating-selector rating-selector--bar${className ? ` ${className}` : ''}`}>
        {showHeader ? <Header label={label} sublabel={sublabel} value={value} valueSuffix={valueSuffix} color={color} /> : null}
        <div className="rating-selector__bar-track">
          <div className="rating-selector__bar-fill" style={{ width: `${pct}%`, background: color }} />
          <div className="rating-selector__bar-thumb" style={{ left: `${pct}%`, background: color }} />
        </div>
        {lowHint || midHint || highHint ? (
          <div className="rating-selector__hints">
            <span className="rating-selector__hint">{lowHint ?? ''}</span>
            {midHint ? <span className="rating-selector__hint rating-selector__hint--mid" style={{ color }}>{midHint}</span> : null}
            <span className="rating-selector__hint">{highHint ?? ''}</span>
          </div>
        ) : null}
      </div>
    )
  }

  return <SteppedSelector {...props} color={color} showHeader={showHeader} />
}

function SteppedSelector(props: RatingSelectorSteppedProps & { color: string; showHeader: boolean }) {
  const {
    label, sublabel, value, steps, variant = 'numbered', icon = 'star', iconSize = 28,
    lowHint, highHint, valueSuffix, onChange, testIdPrefix, color, showHeader, className,
  } = props

  const interactive = onChange != null
  const IconCmp = icon === 'star' ? Star : Sun
  const stepTestId = (n: number): string | undefined => (testIdPrefix != null ? `${testIdPrefix}-${n}` : undefined)

  // Handler stable unique : la valeur cliquée est lue dans data-value (zéro arrow inline par pas).
  const handleStepClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      onChange?.(Number(e.currentTarget.dataset.value))
    },
    [onChange],
  )

  const renderStep = (n: number) => {
    const selected = value === n
    const filled = (variant === 'track' || variant === 'icon') && value != null && n <= value

    const inner = variant === 'icon'
      ? <IconCmp size={iconSize} fill={filled ? 'currentColor' : 'none'} style={{ color: filled ? color : 'var(--color-border)' }} />
      : variant === 'track'
        ? null
        : <span className="rating-selector__step-num">{n}</span>

    const stepClass = variant === 'icon'
      ? 'rating-selector__icon'
      : variant === 'track'
        ? `rating-selector__track-seg${selected || filled ? ' rating-selector__track-seg--filled' : ''}`
        : `rating-selector__step${selected ? ' rating-selector__step--selected' : ''}`

    const stepStyle = variant === 'track' && (selected || filled)
      ? { background: color }
      : variant === 'numbered' && selected
        ? { background: color, borderColor: color }
        : undefined

    if (interactive) {
      return (
        <button
          key={n}
          type="button"
          className={stepClass}
          style={stepStyle}
          onClick={handleStepClick}
          data-value={n}
          role="radio"
          aria-checked={selected}
          aria-label={`${label} : ${n}`}
          data-testid={stepTestId(n)}
        >
          {inner}
        </button>
      )
    }
    return (
      <span key={n} className={stepClass} style={stepStyle} data-testid={stepTestId(n)}>
        {inner}
      </span>
    )
  }

  const groupClass = variant === 'icon'
    ? 'rating-selector__icons'
    : variant === 'track'
      ? 'rating-selector__track'
      : 'rating-selector__steps'

  return (
    <div className={`rating-selector${className ? ` ${className}` : ''}`}>
      {showHeader ? <Header label={label} sublabel={sublabel} value={value} valueSuffix={valueSuffix} color={color} /> : null}
      <div className={groupClass} role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? label : undefined}>
        {steps.map(renderStep)}
      </div>
      {lowHint || highHint ? (
        <div className="rating-selector__hints">
          <span className="rating-selector__hint">{lowHint ?? ''}</span>
          <span className="rating-selector__hint">{highHint ?? ''}</span>
        </div>
      ) : null}
    </div>
  )
}
