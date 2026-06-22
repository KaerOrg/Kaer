import type { ComponentType, ReactNode } from 'react'
import { logger } from '@kaer/shared'
import type { ContentField } from '../../../../../services/moduleService'
import {
  type FieldProps,
  CardDefinition,
  FieldError,
  FieldListItem,
  FieldText,
} from '../../fields'
import { CardDivider } from '../CardDivider'

const FIELD_REGISTRY: Record<string, ComponentType<FieldProps>> = {
  card_callout:        FieldText,
  card_definition:     CardDefinition,
  card_divider:        CardDivider,
  card_heading:        FieldText,
  card_list_item:      FieldListItem,
  card_numbered_item:  FieldListItem,
  card_paragraph:      FieldText,
}

function renderField(f: ContentField, t: (key: string) => string): ReactNode {
  const Component = FIELD_REGISTRY[f.field_type]
  if (!Component) {
    logger.warn(`[ModuleRenderer] field_type non géré : "${f.field_type}"`)
    return <FieldError key={f.id} fieldId={f.id} fieldType={f.field_type} reason="unknown_type" />
  }
  return <Component key={f.id} field={f} t={t} />
}

export function renderCardBody(fields: ContentField[], t: (key: string) => string): ReactNode {
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
