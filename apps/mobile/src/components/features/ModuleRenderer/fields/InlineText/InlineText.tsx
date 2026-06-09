import React from 'react'
import { Text } from 'react-native'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { FieldProps } from '../types'

export function InlineText({ field }: FieldProps) {
  const t = useModuleTranslation()
  const text = field.text_code ? t(field.text_code) : ''
  if (field.props['bold'] === 'true') {
    return <Text style={{ fontWeight: '700' }}>{text}</Text>
  }
  if (field.props['italic'] === 'true') {
    return <Text style={{ fontStyle: 'italic' }}>{text}</Text>
  }
  return <Text>{text}</Text>
}
