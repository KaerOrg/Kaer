import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../../../theme'
import type { FieldProps } from '../types'

export function CardDefinition({ field, t }: FieldProps) {
  const termCode = field.props['term_code']
  const term = termCode ? t(termCode) : ''
  const definition = field.text_code ? t(field.text_code) : ''

  return (
    <View style={styles.row}>
      <Text style={styles.term}>{term}</Text>
      <Text style={styles.definition}>{definition}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  term: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 14,
    minWidth: 80,
  },
  definition: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
})
