import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}

export function StepsLayout({ sections, footer, t }: Props) {
  return (
    <>
      <ol className="preview-steps">
        {[...sections.entries()].map(([sectionId, fields]) => {
          const titleField = fields.find(f => f.field_type === 'step_title')
          const hintField = fields.find(f => f.field_type === 'step_hint')
          if (!titleField) return null
          const color = titleField.props['color'] ?? '#6366F1'
          const num = titleField.props['step_number'] ?? ''
          return (
            <li key={sectionId} className="preview-step">
              <span className="preview-step__num" style={{ backgroundColor: color }}>{num}</span>
              <div>
                <FieldText field={titleField} t={t} />
                {hintField && <FieldText field={hintField} t={t} />}
              </div>
            </li>
          )
        })}
      </ol>
      {footer && <FieldText field={footer} t={t} />}
    </>
  )
}
