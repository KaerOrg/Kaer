import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { logger } from '@psytool/shared'
import type { ContentField } from '../../lib/moduleService'
import {
  type FieldProps,
  CardDefinition,
  FieldListItem,
  FieldRow,
  FieldText,
} from './fields'

// ─── Registry: field_type → composant ────────────────────────────────────────

function CardDivider() { return <hr /> }

const FIELD_REGISTRY: Record<string, ComponentType<FieldProps>> = {
  card_callout:        FieldText,
  card_definition:     CardDefinition,
  card_divider:        CardDivider,
  card_heading_2:      FieldText,
  card_heading_3:      FieldText,
  card_heading_4:      FieldText,
  card_italic_note:    FieldText,
  card_list_item:      FieldListItem,
  card_numbered_item:  FieldListItem,
  card_paragraph:      FieldText,
  card_paragraph_bold: FieldText,
}

// ─── Lookup registry avec avertissement sur type inconnu ─────────────────────

function renderField(f: ContentField, t: (key: string) => string): ReactNode {
  const Component = FIELD_REGISTRY[f.field_type]
  if (!Component) {
    logger.warn(`[ModuleRenderer] field_type non géré : "${f.field_type}"`)
    return null
  }
  return <Component key={f.id} field={f} t={t} />
}

// ─── Groupement des list items consécutifs en ul/ol ──────────────────────────

function renderCardBodyFields(fields: ContentField[], t: (key: string) => string): ReactNode {
  const result: ReactNode[] = []
  let listBuffer: ContentField[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listBuffer.length === 0) return
    const Tag = listType ?? 'ul'
    result.push(
      <Tag key={`list-${listBuffer[0].id}`} className="fr-list">
        {listBuffer.map(f => renderField(f, t))}
      </Tag>
    )
    listBuffer = []
    listType = null
  }

  for (const f of fields) {
    if (f.field_type === 'card_list_item') {
      if (listType === 'ol') flushList()
      listType = 'ul'
      listBuffer.push(f)
    } else if (f.field_type === 'card_numbered_item') {
      if (listType === 'ul') flushList()
      listType = 'ol'
      listBuffer.push(f)
    } else {
      flushList()
      result.push(renderField(f, t))
    }
  }
  flushList()
  return result
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

function StepsLayout({ sections, footer, t }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}) {
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

function FieldsLayout({ fields, footer, t }: {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  return (
    <>
      <ul className="preview-fields">
        {fields.map(f => <FieldRow key={f.id} field={f} t={t} />)}
      </ul>
      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
    </>
  )
}

function Grid2x2Layout({ sections, footer, t }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}) {
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

function CardsLayout({ sections, expandedCard, onToggle, t }: {
  sections: Map<string, ContentField[]>
  expandedCard: string | null
  onToggle: (id: string) => void
  t: (key: string) => string
}) {
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
                {renderCardBodyFields(bodyFields, t)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main FieldRenderer ───────────────────────────────────────────────────────

export interface FieldRendererProps {
  preview_kind: string
  fields: ContentField[]
  expandedCard: string | null
  onToggleCard: (id: string) => void
}

export function FieldRenderer({ preview_kind, fields, expandedCard, onToggleCard }: FieldRendererProps) {
  const { t } = useTranslation()

  if (preview_kind === 'coming_soon' || fields.length === 0) return null

  const visibleFields = fields.filter(
    f => f.field_type !== 'module_label' && f.field_type !== 'module_description'
  )
  const footer = visibleFields.find(f => f.field_type === 'footer_note')
  const contentFields = visibleFields.filter(f => f.field_type !== 'footer_note')

  if (preview_kind === 'steps' || preview_kind === 'cards') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    if (preview_kind === 'steps') return <StepsLayout sections={sections} footer={footer} t={t} />
    return (
      <CardsLayout
        sections={sections}
        expandedCard={expandedCard}
        onToggle={onToggleCard}
        t={t}
      />
    )
  }

  if (preview_kind === 'fields') {
    const fieldRows = contentFields.filter(f => f.field_type === 'field_row')
    return <FieldsLayout fields={fieldRows} footer={footer} t={t} />
  }

  if (preview_kind === 'grid2x2') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    return <Grid2x2Layout sections={sections} footer={footer} t={t} />
  }

  return null
}
