// ─── WizardProgress — barre de progression segmentée du wizard column_form ───
//
// Présentationnel : N segments, remplis jusqu'à l'étape courante (incluse) avec
// la couleur d'accent, les suivants en gris. Aucune donnée patient, aucune
// interprétation — simple repère de position dans la saisie (MDR 2017/745).

import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { colors } from '@theme'
import { styles } from './styles'

export interface WizardProgressProps {
  /** Nombre total d'étapes. */
  total: number
  /** Index de l'étape courante (0-based). */
  current: number
  /** Couleur de remplissage des segments atteints. */
  accent: string
  testID?: string
}

export const WizardProgress = memo(function WizardProgress({
  total, current, accent, testID,
}: WizardProgressProps) {
  const segments = useMemo(() => Array.from({ length: total }, (_, i) => i), [total])
  return (
    <View style={styles.progress} testID={testID}>
      {segments.map(i => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: i <= current ? accent : colors.border },
          ]}
          testID={testID != null ? `${testID}-${i}` : undefined}
        />
      ))}
    </View>
  )
})
