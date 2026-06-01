import './ValueBar.css'
import type { ValueBarProps } from './ValueBar.types'

const DEFAULT_COLOR = 'var(--color-primary)'

/**
 * Barre de valeur statique et passive : une dimension (label), sa valeur courante,
 * une jauge colorée positionnée dans [min, max], et des repères d'extrémité.
 * Présentationnel pur — aucune saisie, aucune interprétation (conforme MDR : affiche, ne conclut pas).
 */
export function ValueBar({ label, value, min = 1, max = 10, color = DEFAULT_COLOR, lowHint, highHint }: ValueBarProps) {
  const ratio = max > min ? (value - min) / (max - min) : 0
  const pct = Math.max(0, Math.min(1, ratio)) * 100

  return (
    <div className="value-bar">
      <div className="value-bar__header">
        <span className="value-bar__dot" style={{ background: color }} />
        <span className="value-bar__label" style={{ color }}>{label}</span>
        <span className="value-bar__value" style={{ color }}>{value}</span>
      </div>
      <div className="value-bar__track">
        <div className="value-bar__fill" style={{ width: `${pct}%`, background: color }} />
        <div className="value-bar__thumb" style={{ left: `${pct}%`, background: color }} />
      </div>
      {lowHint || highHint ? (
        <div className="value-bar__hints">
          <span className="value-bar__hint">{lowHint ?? ''}</span>
          <span className="value-bar__hint">{highHint ?? ''}</span>
        </div>
      ) : null}
    </div>
  )
}
