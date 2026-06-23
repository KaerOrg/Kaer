
import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { colors } from '@theme'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { FieldProps } from '../types'
import { InlineText } from '../InlineText'

interface FieldConfig {
  variant: 'heading' | 'paragraph' | 'callout' | 'footer' |
           'step_title' | 'step_hint' |
           'card_title' | 'card_summary'
  quoted?: boolean
}

const CONFIG: Record<string, FieldConfig> = {
  card_heading:        { variant: 'heading' },
  card_paragraph:      { variant: 'paragraph' },
  card_callout:        { variant: 'callout' },
  footer_note:         { variant: 'footer' },
  step_title:          { variant: 'step_title' },
  step_hint:           { variant: 'step_hint', quoted: true },
  card_title:          { variant: 'card_title' },
  card_summary:        { variant: 'card_summary' },
}

export function FieldText({ field }: FieldProps) {
  const t = useModuleTranslation()
  const cfg = CONFIG[field.field_type]
  if (!cfg) return null

  const rawText = field.text_code ? t(field.text_code) : ''
  const text = cfg.quoted ? `"${rawText}"` : rawText

  const body = field.children.length > 0
    ? <>{field.children.map(c => <InlineText key={c.id} field={c} />)}</>
    : <Text>{text}</Text>

  if (cfg.variant === 'callout') {
    return (
      <View style={styles.callout}>
        <Text style={styles.calloutText}>{text}</Text>
      </View>
    )
  }

  if (cfg.variant === 'footer') {
    return <Text style={styles.footer}>{text}</Text>
  }

  if (cfg.variant === 'step_title') {
    return <Text style={styles.stepTitle}>{text}</Text>
  }

  if (cfg.variant === 'step_hint') {
    return <Text style={styles.stepHint}>{text}</Text>
  }

  if (cfg.variant === 'card_title') {
    return <Text style={styles.cardTitle}>{text}</Text>
  }

  if (cfg.variant === 'card_summary') {
    return <Text style={styles.cardSummary}>{text}</Text>
  }

  if (cfg.variant === 'heading') {
    const lvl = field.props['level']
    const style = lvl === '3' ? styles.h3 : lvl === '4' ? styles.h4 : styles.h2
    return <Text style={style}>{body}</Text>
  }
  const isBold = field.props['bold'] === 'true'
  const isItalic = field.props['italic'] === 'true'
  return <Text style={isBold ? styles.bold : isItalic ? styles.italic : styles.paragraph}>{body}</Text>
}

const styles = StyleSheet.create({
  h2:               { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 16 },
  h3:               { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 12 },
  h4:               { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 },
  paragraph:        { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 8 },
  bold:             { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 22, marginBottom: 8 },
  italic:           { fontSize: 14, fontStyle: 'italic', color: colors.textMuted, lineHeight: 22, marginBottom: 8 },
  callout:          { borderLeftWidth: 3, borderLeftColor: '#4F46E5', paddingLeft: 12, marginVertical: 12, backgroundColor: '#EEF2FF', borderRadius: 4, paddingVertical: 8 },
  calloutText:      { fontSize: 14, fontWeight: '700', color: '#4F46E5', lineHeight: 20 },
  footer:           { fontSize: 12, color: colors.textMuted, backgroundColor: '#F3F4F6', borderRadius: 6, padding: 10, marginTop: 16, lineHeight: 18 },
  stepTitle:        { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  stepHint:         { fontSize: 13, fontStyle: 'italic', color: colors.textMuted, marginTop: 2 },
  cardTitle:        { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSummary:      { fontSize: 13, color: colors.textMuted, marginTop: 2 },
})
