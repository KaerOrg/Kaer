import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Chip } from '@ui/Chip'
import { colors } from '@theme'

export function TimeWidget() {
  return (
    <Chip
      label="22:00"
      size="sm"
      muted
      icon={<Ionicons name="time-outline" size={12} color={colors.textMuted} />}
    />
  )
}
