import './InputField.css'
import type { InputFieldProps } from './InputField.types'

const WHITESPACE_RE = /\s+/g

export function InputField({ label, error, id, ...props }: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(WHITESPACE_RE, '-')

  return (
    <div className="input-field">
      <label className="input-field__label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
        {...props}
      />
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  )
}
