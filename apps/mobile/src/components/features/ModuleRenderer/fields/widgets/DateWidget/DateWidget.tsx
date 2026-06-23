import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Chip } from '@ui/Chip'
import { colors } from '@theme'

export function DateWidget() {
  return (
    <Chip
      label="jj/mm/aaaa"
      size="sm"
      muted
      icon={<Ionicons name="calendar-outline" size={12} color={colors.textMuted} />}
    />
  )
}
