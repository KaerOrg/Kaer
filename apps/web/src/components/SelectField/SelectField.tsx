import type { SelectHTMLAttributes, ReactNode } from 'react'
import '../InputField/InputField.css'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
  error?: string
}

export function SelectField({ label, children, error, id, ...props }: SelectFieldProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="input-field">
      <div className="input-field__label-row">
        <label className="input-field__label" htmlFor={selectId}>{label}</label>
      </div>
      <select
        id={selectId}
        className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  )
}
