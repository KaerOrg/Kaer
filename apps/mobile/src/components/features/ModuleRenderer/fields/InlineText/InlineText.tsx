import React from 'react'
import { Text } from 'react-native'
import { useModuleT } from '../../../../../hooks/useModuleT'
import type { FieldProps } from '../types'

export function InlineText({ field }: FieldProps) {
  const t = useModuleT()
  const text = field.text_code ? t(field.text_code) : ''
  if (field.props['bold'] === 'true') {
    return <Text style={{ fontWeight: '700' }}>{text}</Text>
  }
  if (field.props['italic'] === 'true') {
    return <Text style={{ fontStyle: 'italic' }}>{text}</Text>
  }
  return <Text>{text}</Text>
}
