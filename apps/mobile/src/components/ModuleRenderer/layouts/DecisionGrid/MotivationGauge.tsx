import React from 'react'
import { View, Text } from 'react-native'
import { colors } from '../../../../theme'
import { dgStyles } from './styles'

export interface MotivationGaugeProps {
  title: string
  changeLabel: string
  statusLabel: string
  changeScore: number
  statusQuoScore: number
  /** Color used for the filled portion of the gauge bar (defaults to theme primary). */
  fillColor?: string
}

/**
 * Pure visual gauge of the motivation ratio. Conformity MDR : the bar shows a
 * raw arithmetic ratio of the user-assigned weights. No threshold, no label.
 *
 *   motivationPercent = changeScore / (changeScore + statusQuoScore) × 100
 *   (50% by convention when both scores are zero)
 */
export function MotivationGauge({
  title,
  changeLabel,
  statusLabel,
  changeScore,
  statusQuoScore,
  fillColor = colors.primary,
}: MotivationGaugeProps) {
  const total = changeScore + statusQuoScore
  const motivationPercent = total === 0 ? 50 : Math.round((changeScore / total) * 100)
  return (
    <View style={dgStyles.gaugeContainer} testID="motivation-gauge">
      <Text style={dgStyles.gaugeTitle}>{title}</Text>
      <View style={dgStyles.gaugeLabels}>
        <Text style={dgStyles.gaugeLabelText}>{statusLabel} ({statusQuoScore})</Text>
        <Text style={dgStyles.gaugeLabelText}>{changeLabel} ({changeScore})</Text>
      </View>
      <View style={dgStyles.gaugeTrack}>
        <View
          style={[dgStyles.gaugeFill, { width: `${motivationPercent}%` as `${number}%`, backgroundColor: fillColor }]}
          testID="motivation-gauge-fill"
        />
        <View style={[dgStyles.gaugeMarker, { left: '50%' as const }]} />
      </View>
    </View>
  )
}
