// ─── Rendu du corps d'une carte (registry des field_type de carte) ───────────
//
// `renderCardBodyFields` transforme une liste de fields « corps de carte » en
// nodes React : chaque field_type est mappé vers son composant via FIELD_REGISTRY,
// et les items de liste consécutifs (`card_list_item` / `card_numbered_item`)
// sont regroupés dans un bloc. Réutilisable par tout layout affichant des cartes.

import React, { ComponentType } from 'react'
import { View } from 'react-native'
import { logger } from '@kaer/shared'
import type { ContentField } from '../../../../../services/moduleService'
import { type FieldProps, CardDefinition, FieldListItem, FieldText } from '../../fields'
import { styles } from './styles'

function CardDivider() {
  return <View style={styles.divider} />
}

const FIELD_REGISTRY: Record<string, ComponentType<FieldProps>> = {
  card_callout:        FieldText,
  card_definition:     CardDefinition,
  card_divider:        CardDivider,
  card_heading:        FieldText,
  card_list_item:      FieldListItem,
  card_numbered_item:  FieldListItem,
  card_paragraph:      FieldText,
}

function renderField(f: ContentField): React.ReactNode {
  const Component = FIELD_REGISTRY[f.field_type]
  if (!Component) {
    logger.warn(`[ModuleRenderer] field_type non géré : "${f.field_type}"`)
    return null
  }
  return <Component key={f.id} field={f} />
}

/**
 * Rend les fields du corps d'une carte, en regroupant les listes à puces /
 * numérotées consécutives dans un bloc unique.
 */
export function renderCardBodyFields(fields: ContentField[]): React.ReactNode {
  const result: React.ReactNode[] = []
  let listBuffer: ContentField[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listBuffer.length === 0) return
    result.push(
      <View key={`list-${listBuffer[0].id}`} style={styles.listBlock}>
        {listBuffer.map(f => renderField(f))}
      </View>
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
      result.push(renderField(f))
    }
  }
  flushList()
  return result
}
