import type { FieldProps } from '../types'

export function CardDefinition({ field, t }: FieldProps) {
  const text = field.text_code ? t(field.text_code) : ''
  const defCode = field.props['definition_text_code']
  const defText = defCode ? t(defCode) : ''
  return (
    <p>
      <strong>{text}</strong>
      {defText && <span> — {defText}</span>}
    </p>
  )
}
