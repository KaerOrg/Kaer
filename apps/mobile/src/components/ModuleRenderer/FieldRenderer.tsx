import React, { useState, useCallback, ComponentType } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { logger } from '@psytool/shared'
import { colors, spacing } from '../../theme'
import type { ContentField } from '../../lib/moduleService'
import {
  type FieldProps,
  CardDefinition,
  FieldListItem,
  FieldRow,
  FieldText,
} from './fields'

// ─── Registry ────────────────────────────────────────────────────────────────

function CardDivider() { return <View style={styles.divider} /> }

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

function renderField(f: ContentField, t: (key: string) => string): React.ReactNode {
  const Component = FIELD_REGISTRY[f.field_type]
  if (!Component) {
    logger.warn(`[ModuleRenderer] field_type non géré : "${f.field_type}"`)
    return null
  }
  return <Component key={f.id} field={f} t={t} />
}

// ─── List rendering (replaces ul/ol) ─────────────────────────────────────────

function renderCardBodyFields(
  fields: ContentField[],
  t: (key: string) => string,
): React.ReactNode {
  const result: React.ReactNode[] = []
  let listBuffer: ContentField[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listBuffer.length === 0) return
    result.push(
      <View key={`list-${listBuffer[0].id}`} style={styles.listBlock}>
        {listBuffer.map(f => renderField(f, t))}
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
      result.push(renderField(f, t))
    }
  }
  flushList()
  return result
}

// ─── Layouts ─────────────────────────────────────────────────────────────────

function StepsLayout({ sections, footer, t }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  return (
    <View style={styles.stepsContainer}>
      {[...sections.entries()].map(([sectionId, fields], idx) => {
        const titleField = fields.find(f => f.field_type === 'step_title')
        const hintField = fields.find(f => f.field_type === 'step_hint')
        if (!titleField) return null
        const color = titleField.props['color'] ?? '#6366F1'
        const num = titleField.props['step_number'] ?? String(idx + 1)
        return (
          <View key={sectionId} style={styles.stepRow}>
            <View style={[styles.stepBadge, { backgroundColor: color }]}>
              <Text style={styles.stepNum}>{num}</Text>
            </View>
            <View style={styles.stepContent}>
              <FieldText field={titleField} t={t} />
              {hintField && <FieldText field={hintField} t={t} />}
            </View>
          </View>
        )
      })}
      {footer && <FieldText field={footer} t={t} />}
    </View>
  )
}

function FieldsLayout({ fields, footer, t }: {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  return (
    <View>
      <View style={styles.fieldsBlock}>
        {fields.map(f => <FieldRow key={f.id} field={f} t={t} />)}
      </View>
      {footer && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <FieldText field={footer} t={t} />
        </View>
      )}
    </View>
  )
}

function Grid2x2Layout({ sections, footer, t }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  const entries = [...sections.entries()]
  return (
    <View>
      <View style={styles.grid}>
        {entries.map(([sectionId, fields]) => {
          const titleField = fields.find(f => f.field_type === 'quadrant_title')
          const subtitleField = fields.find(f => f.field_type === 'quadrant_subtitle')
          const color = titleField?.props['color'] ?? '#6366F1'
          return (
            <View key={sectionId} style={[styles.quadrant, { borderTopColor: color, borderTopWidth: 3 }]}>
              {titleField && <FieldText field={titleField} t={t} />}
              {subtitleField && <FieldText field={subtitleField} t={t} />}
            </View>
          )
        })}
      </View>
      {footer && <FieldText field={footer} t={t} />}
    </View>
  )
}

function CardsLayout({ sections, t }: {
  sections: Map<string, ContentField[]>
  t: (key: string) => string
}) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const handleToggle = useCallback((id: string) => {
    setExpandedCard(prev => (prev === id ? null : id))
  }, [])

  return (
    <View style={styles.cardsBlock}>
      {[...sections.entries()].map(([sectionId, fields]) => {
        const titleField = fields.find(f => f.field_type === 'card_title')
        const summaryField = fields.find(f => f.field_type === 'card_summary')
        const bodyFields = fields.filter(
          f => f.field_type !== 'card_title' && f.field_type !== 'card_summary'
        )
        const isOpen = expandedCard === sectionId

        return (
          <View key={sectionId} style={styles.card}>
            <Pressable style={styles.cardHeader} onPress={() => handleToggle(sectionId)}>
              <View style={styles.cardMeta}>
                {titleField
                  ? <FieldText field={titleField} t={t} />
                  : <Text style={styles.cardFallbackTitle}>{sectionId}</Text>
                }
                {summaryField && <FieldText field={summaryField} t={t} />}
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            {isOpen && bodyFields.length > 0 && (
              <View style={styles.cardBody}>
                {renderCardBodyFields(bodyFields, t)}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export interface FieldRendererProps {
  preview_kind: string
  fields: ContentField[]
}

export function FieldRenderer({ preview_kind, fields }: FieldRendererProps) {
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
    if (preview_kind === 'steps') {
      return <StepsLayout sections={sections} footer={footer} t={t} />
    }
    return <CardsLayout sections={sections} t={t} />
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

const styles = StyleSheet.create({
  divider:        { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  stepsContainer: { gap: spacing.md },
  stepRow:        { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepBadge:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepContent:    { flex: 1 },
  listBlock:      { gap: 2 },
  fieldsBlock:    { gap: 0 },
  infoBox:        { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 12, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quadrant:       { width: '47%', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12 },
  cardsBlock:     { gap: 8 },
  card:           { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  cardMeta:       { flex: 1 },
  cardFallbackTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardBody:       { padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
})
