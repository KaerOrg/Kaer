import type { FieldProps } from '../types'
import { InlineText } from '../InlineText'

export function FieldListItem({ field, t }: FieldProps) {
  const text = field.text_code ? t(field.text_code) : ''
  const num = field.props['item_number']
  return (
    <li value={num ? parseInt(num) : undefined}>
      {field.children.length > 0
        ? <>{field.children.map(c => <InlineText key={c.id} field={c} t={t} />)}</>
        : text}
    </li>
  )
}
