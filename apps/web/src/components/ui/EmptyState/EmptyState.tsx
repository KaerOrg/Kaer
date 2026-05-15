import { Button } from '../Button'
import './EmptyState.css'
import type { EmptyStateProps } from './EmptyState.types'

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon ? <span className="empty-state__icon">{icon}</span> : null}
      <p className="empty-state__title">{title}</p>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {action ? (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
