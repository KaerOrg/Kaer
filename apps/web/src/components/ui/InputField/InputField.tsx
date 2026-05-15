import './InputField.css'
import type { InputFieldProps } from './InputField.types'

const WHITESPACE_RE = /\s+/g

export function InputField({ label, error, id, required, ...props }: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(WHITESPACE_RE, '-')

  return (
    <div className="input-field">
      <div className="input-field__label-row">
        <label className="input-field__label" htmlFor={inputId}>{label}</label>
        {required && <span className="input-field__required" aria-hidden="true">*</span>}
      </div>
      <input
        id={inputId}
        className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
        required={required}
        {...props}
      />
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  )
}
