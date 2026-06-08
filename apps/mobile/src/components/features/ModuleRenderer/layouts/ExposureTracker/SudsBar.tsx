import React from 'react'
import { View, Text } from 'react-native'
import { etStyles } from './styles'

export interface SudsBarProps {
  label: string
  value: number | null
  color: string
  max: number
}

/** Barre SUDS brute (valeur / max). Affichage passif — aucune couleur de jugement. */
export function SudsBar({ label, value, color, max }: SudsBarProps) {
  if (value === null) {
    return (
      <View style={etStyles.sudsRow}>
        <Text style={etStyles.sudsLabel}>{label}</Text>
        <Text style={etStyles.sudsPending}>—</Text>
      </View>
    )
  }
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <View style={etStyles.sudsRow}>
      <Text style={etStyles.sudsLabel}>{label}</Text>
      <View style={etStyles.sudsTrack}>
        <View style={[etStyles.sudsFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[etStyles.sudsValue, { color }]}>{value}</Text>
    </View>
  )
}
