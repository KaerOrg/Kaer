import type { CSSProperties, ReactNode } from 'react'
import type { FieldProps } from '../types'
import { FieldError } from '../FieldError/FieldError'
import { InlineText } from '../InlineText'

type HtmlTag = 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span'

interface FieldConfig {
  tag: HtmlTag
  wrap?: 'strong' | 'em'
  className?: string
  propColor?: boolean
  inlineStyle?: CSSProperties
  quoted?: boolean
}

const CONFIG: Record<string, FieldConfig> = {
  card_heading:        { tag: 'h2' },
  card_paragraph:      { tag: 'p' },
  card_callout:        { tag: 'p', inlineStyle: { fontWeight: 700, borderLeft: '3px solid #4F46E5', paddingLeft: 10, marginTop: 12 } },
  footer_note:         { tag: 'p', className: 'preview-panel__footer' },
  step_title:          { tag: 'div', className: 'preview-step__title' },
  step_hint:           { tag: 'div', className: 'preview-step__hint', quoted: true },
  card_title:          { tag: 'span', className: 'preview-card__title' },
  card_summary:        { tag: 'span', className: 'preview-card__summary' },
}

export function FieldText({ field, t }: FieldProps) {
  const cfg = CONFIG[field.field_type]
  if (!cfg) return <FieldError fieldId={field.id} fieldType={field.field_type} reason="unknown_type" />

  const { tag, wrap: baseWrap, className, propColor, inlineStyle, quoted } = cfg
  const Tag: HtmlTag = field.field_type === 'card_heading'
    ? (field.props['level'] === '3' ? 'h3' : field.props['level'] === '4' ? 'h4' : 'h2')
    : tag
  const wrap = baseWrap ?? (
    field.props['bold'] === 'true' ? 'strong' :
    field.props['italic'] === 'true' ? 'em' :
    undefined
  )
  const text = field.text_code ? t(field.text_code) : ''
  const style = propColor ? { color: field.props['color'] ?? '#6366F1', ...inlineStyle } : inlineStyle

  const body: ReactNode = field.children.length > 0
    ? <>{field.children.map(c => <InlineText key={c.id} field={c} t={t} />)}</>
    : quoted ? `"${text}"` : text

  const inner: ReactNode = wrap === 'strong' ? <strong>{body}</strong>
    : wrap === 'em' ? <em>{body}</em>
    : body

  return <Tag className={className} style={style}>{inner}</Tag>
}
