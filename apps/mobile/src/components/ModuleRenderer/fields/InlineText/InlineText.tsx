import React from 'react'
import { Text } from 'react-native'
import type { FieldProps } from '../types'

export function InlineText({ field, t }: FieldProps) {
  const text = field.text_code ? t(field.text_code) : ''
  if (field.props['bold'] === 'true') {
    return <Text style={{ fontWeight: '700' }}>{text}</Text>
  }
  if (field.props['italic'] === 'true') {
    return <Text style={{ fontStyle: 'italic' }}>{text}</Text>
  }
  return <Text>{text}</Text>
}
