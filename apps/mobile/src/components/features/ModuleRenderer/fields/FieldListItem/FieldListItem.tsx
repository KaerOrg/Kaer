import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../../../../theme'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { FieldProps } from '../types'
import { InlineText } from '../InlineText'

export function FieldListItem({ field }: FieldProps) {
  const t = useModuleTranslation()
  const text = field.text_code ? t(field.text_code) : ''
  const isNumbered = field.field_type === 'card_numbered_item'
  const num = field.props['item_number'] ?? '•'
  const bullet = isNumbered ? `${num}.` : '•'

  return (
    <View style={styles.row}>
      <Text style={styles.bullet}>{bullet}</Text>
      <Text style={styles.text}>
        {field.children.length > 0
          ? <>{field.children.map(c => <InlineText key={c.id} field={c} />)}</>
          : text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row:    { flexDirection: 'row', gap: 8, marginBottom: 4 },
  bullet: { fontSize: 14, color: colors.textMuted, width: 20, textAlign: 'right' },
  text:   { flex: 1, fontSize: 14, color: colors.text, lineHeight: 22 },
})
