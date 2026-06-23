import type { SelectHTMLAttributes, ReactNode } from 'react'
import '../InputField/InputField.css'

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
  error?: string
  /** Variante compacte (barres de filtres) : contrôle moins haut que le défaut. */
  compact?: boolean
}

/** Liste déroulante du design system : `<select>` natif habillé (label + erreur). */
export function Dropdown({ label, children, error, id, compact = false, ...props }: DropdownProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="input-field">
      <div className="input-field__label-row">
        <label className="input-field__label" htmlFor={selectId}>{label}</label>
      </div>
      <select
        id={selectId}
        className={`input-field__input ${compact ? 'input-field__input--sm' : ''} ${error ? 'input-field__input--error' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  )
}
