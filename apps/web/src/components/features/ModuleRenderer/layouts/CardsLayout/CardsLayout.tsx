import type { ContentField } from '@services/moduleService'
import { FieldText } from '../../fields'
import { renderCardBody } from './renderCardBody'

interface Props {
  sections: Map<string, ContentField[]>
  expandedCard: string | null
  onToggle: (id: string) => void
  t: (key: string) => string
}

export function CardsLayout({ sections, expandedCard, onToggle, t }: Props) {
  return (
    <div className="preview-cards">
      {[...sections.entries()].map(([sectionId, fields]) => {
        const titleField = fields.find(f => f.field_type === 'card_title')
        const summaryField = fields.find(f => f.field_type === 'card_summary')
        const bodyFields = fields.filter(
          f => f.field_type !== 'card_title' && f.field_type !== 'card_summary'
        )
        const isOpen = expandedCard === sectionId

        return (
          <div key={sectionId} className="preview-card">
            <button className="preview-card__header" onClick={() => onToggle(sectionId)}>
              <div className="preview-card__meta">
                {titleField
                  ? <FieldText field={titleField} t={t} />
                  : <span className="preview-card__title">{sectionId}</span>
                }
                {summaryField && <FieldText field={summaryField} t={t} />}
              </div>
              <span className="preview-card__toggle">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && bodyFields.length > 0 && (
              <div className="preview-card__body">
                {renderCardBody(bodyFields, t)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
