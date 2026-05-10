import type { ContentField } from '../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}

export function Grid2x2Layout({ sections, footer, t }: Props) {
  return (
    <>
      <div className="preview-grid2x2">
        {[...sections.entries()].map(([sectionId, fields]) => {
          const titleField = fields.find(f => f.field_type === 'quadrant_title')
          const subtitleField = fields.find(f => f.field_type === 'quadrant_subtitle')
          const color = titleField?.props['color'] ?? '#6366F1'
          return (
            <div key={sectionId} className="preview-quadrant" style={{ borderTopColor: color }}>
              {titleField && <FieldText field={titleField} t={t} />}
              {subtitleField && <FieldText field={subtitleField} t={t} />}
            </div>
          )
        })}
      </div>
      {footer && <FieldText field={footer} t={t} />}
    </>
  )
}
