import type { InputHTMLAttributes } from 'react'
import './InputField.css'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function InputField({ label, error, id, ...props }: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="input-field">
      <label className="input-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
        {...props}
      />
      {error && <span className="input-field__error">{error}</span>}
    </div>
  )
}
