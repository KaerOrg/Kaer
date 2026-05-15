import type { FieldProps } from '../types'

export function InlineText({ field, t }: FieldProps) {
  const text = field.text_code ? t(field.text_code) : ''
  if (field.props['bold'] === 'true') return <strong>{text}</strong>
  if (field.props['italic'] === 'true') return <em>{text}</em>
  return <span>{text}</span>
}
