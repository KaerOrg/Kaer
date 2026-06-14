import './Button.css'
import type { ButtonProps } from './Button.types'

export function Button({ variant = 'primary', size = 'md', category = 'neutral', loading = false, icon, disabled, children, className = '', ...props }: ButtonProps) {
  // Icône-seule dérivée de la présence d'`icon` sans `children` — pas de prop booléenne redondante.
  const iconOnly = icon != null && children == null
  return (
    <button
      className={`btn btn--${variant} btn--${size} btn--cat-${category} ${iconOnly ? 'btn--icon-only' : ''} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="btn__spinner" /> : icon}
      {children}
    </button>
  )
}
