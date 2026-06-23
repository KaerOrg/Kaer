import React from 'react'
import { View, Text } from 'react-native'
import { styles } from './RatingSelector.styles'

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

interface ContinuousGaugeProps {
  value: number | null
  steps: number[]
  color: string
  unit?: string
  label: string
}

// Jauge continue (affichage) de la variante `track` de RatingSelector : barre
// proportionnelle (fill + thumb) + valeur formatée. min/max = premier/dernier
// `steps`. Le thumb est ancré au bord droit du fill via flexbox — aucun
// positionnement en pourcentage, donc aucun cast.
export function ContinuousGauge({ value, steps, color, unit, label }: ContinuousGaugeProps) {
  const min = steps[0] ?? 0
  const max = steps[steps.length - 1] ?? min
  const ratio = max > min ? clamp01(((value ?? min) - min) / (max - min)) : 0.5
  const valueText = value != null ? `${value}${unit != null && unit !== '' ? ` ${unit}` : ''}` : ''

  return (
    <View
      style={styles.gauge}
      accessibilityRole="progressbar"
      accessibilityLabel={label !== '' ? `${label} : ${valueText}` : valueText}
    >
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { flex: ratio, backgroundColor: color }]} testID="rating-gauge-fill">
          <View style={[styles.gaugeThumb, { backgroundColor: color }]} />
        </View>
        <View style={[styles.gaugeEmpty, { flex: 1 - ratio }]} testID="rating-gauge-empty" />
      </View>
      {value != null && <Text style={[styles.gaugeValue, { color }]}>{valueText}</Text>}
    </View>
  )
}
