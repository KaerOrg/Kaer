import './StatusBadge.css'
import type { StatusBadgeProps } from './StatusBadge.types'

export function StatusBadge({ variant = 'neutral', label, value, icon, className = '' }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${variant} ${className}`}>
      {icon ? <span className="status-badge__icon">{icon}</span> : null}
      <span className="status-badge__label">{label}</span>
      {value !== undefined ? <span className="status-badge__value">{value}</span> : null}
    </span>
  )
}
