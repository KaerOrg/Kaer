import type { ReactNode } from 'react'
import './InputField.css'
import type { InputFieldProps } from './InputField.types'

const WHITESPACE_RE = /\s+/g

export function InputField(props: InputFieldProps) {
  const { label, error, id, required } = props
  const inputId = id ?? label.toLowerCase().replace(WHITESPACE_RE, '-')
  const controlClass = `input-field__input ${error ? 'input-field__input--error' : ''}`

  // Narrow sur `multiline` AVANT le rest spread : TypeScript corrèle alors l'union
  // discriminée et `rest` porte les attributs DOM corrects (input vs textarea).
  let control: ReactNode
  if (props.multiline) {
    const { label: _label, error: _error, multiline: _multiline, id: _id, ...rest } = props
    control = (
      <textarea
        id={inputId}
        className={`${controlClass} input-field__input--textarea`}
        required={required}
        {...rest}
      />
    )
  } else {
    const { label: _label, error: _error, multiline: _multiline, id: _id, ...rest } = props
    control = (
      <input id={inputId} className={controlClass} required={required} {...rest} />
    )
  }

  return (
    <div className="input-field">
      <div className="input-field__label-row">
        <label className="input-field__label" htmlFor={inputId}>{label}</label>
        {required ? <span className="input-field__required" aria-hidden="true">*</span> : null}
      </div>
      {control}
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  )
}
