import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, spacing } from '../../../../../../theme'

interface Props { spec: string }

export function SliderWidget({ spec }: Props) {
  const [, rawMin, rawMax, unit] = spec.split(':')
  const min = Number(rawMin ?? 0)
  const max = Number(rawMax ?? 10)
  const mid = Math.round((min + max) / 2)
  const ratio = max > min ? (mid - min) / (max - min) : 0.5

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: ratio }]} />
        <View style={[styles.empty, { flex: 1 - ratio }]} />
        <View style={styles.thumb} />
      </View>
      <Text style={styles.value}>{mid}{unit ? ' ' + unit : ''}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track:     { flex: 1, height: 4, borderRadius: radius.full, flexDirection: 'row', backgroundColor: colors.border, overflow: 'visible', position: 'relative' },
  fill:      { height: 4, backgroundColor: colors.primary, opacity: 0.5, borderRadius: radius.full },
  empty:     { height: 4, backgroundColor: colors.border, borderRadius: radius.full },
  thumb:     { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, opacity: 0.6, top: -4, left: '50%' as never },
  value:     { fontSize: 11, fontWeight: '600', color: colors.primary, minWidth: 32, textAlign: 'right' },
})
