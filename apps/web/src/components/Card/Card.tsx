import './Card.css'
import type { CardProps } from './Card.types'

export function Card({ header, actions, children, variant = 'default', state, className = '' }: CardProps) {
  return (
    <div className={`card card--${variant} ${state ? `card--${state}` : ''} ${className}`}>
      {header ? (
        <div className="card__header">
          {header.icon ? <span className="card__icon">{header.icon}</span> : null}
          <div className="card__titles">
            <h3 className="card__title">{header.title}</h3>
            {header.subtitle ? <p className="card__subtitle">{header.subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      {children ? <div className="card__body">{children}</div> : null}
      {actions ? <div className="card__actions">{actions}</div> : null}
    </div>
  )
}
