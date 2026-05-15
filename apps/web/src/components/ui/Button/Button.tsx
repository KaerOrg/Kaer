import './Button.css'
import type { ButtonProps } from './Button.types'

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="btn__spinner" /> : null}
      {children}
    </button>
  )
}
