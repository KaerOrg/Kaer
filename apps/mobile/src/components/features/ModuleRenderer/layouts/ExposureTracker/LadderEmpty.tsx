import React from 'react'
import { View } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { EmptyState } from '@ui/EmptyState'
import { etStyles } from './styles'

export interface LadderEmptyProps {
  /** Teinte pastel de l'illustration (pic teal de la config). */
  accent: string
  lbl: (k: string) => string
  onCreate: () => void
}

// Illustration « escalier » : trois marches pastel croissantes + une coche.
// Purement décorative, aucune donnée, aucune valence.
const STEP_HEIGHTS = [28, 44, 60] as const

/** État vide de l'échelle (écran 0) : illustration, copie de co-construction, CTA. */
export function LadderEmpty({ accent, lbl, onCreate }: LadderEmptyProps) {
  const stairs = (
    <View style={etStyles.emptyStairs} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {STEP_HEIGHTS.map((h, i) => (
        <View key={i} style={[etStyles.emptyStep, { height: h, backgroundColor: colors.neutral }]} />
      ))}
      <View style={[etStyles.emptyCheck, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name="check" size={16} color={colors.white} />
      </View>
    </View>
  )

  return (
    <EmptyState
      testID="ladder-empty"
      icon={stairs}
      title={lbl('ladder_empty_title')}
      description={lbl('ladder_empty_text')}
      action={{
        label: lbl('ladder_empty_cta'),
        onPress: onCreate,
        variant: 'primary',
        icon: <MaterialCommunityIcons name="plus" size={20} color={colors.white} />,
        testID: 'ladder-empty-cta',
      }}
      footer={lbl('ladder_empty_nudge')}
    />
  )
}
