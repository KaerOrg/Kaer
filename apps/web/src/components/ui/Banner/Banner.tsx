import { X } from 'lucide-react'
import type { BannerProps } from './Banner.types'
import './Banner.css'

/**
 * Bandeau d'information transversal (design system). Sans logique métier : variante
 * sémantique, icône optionnelle, action optionnelle et fermeture optionnelle.
 * Pour un usage métier (ex. rappel MFA), l'envelopper dans un composant `features/`.
 */
export function Banner({
  variant = 'info',
  icon,
  children,
  action,
  onDismiss,
  dismissLabel,
  className = '',
}: BannerProps) {
  return (
    <div className={`banner banner--${variant} ${className}`} role="status">
      {icon ? <span className="banner__icon">{icon}</span> : null}
      <div className="banner__content">{children}</div>
      {action ? (
        <button type="button" className="banner__action" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          className="banner__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  )
}
