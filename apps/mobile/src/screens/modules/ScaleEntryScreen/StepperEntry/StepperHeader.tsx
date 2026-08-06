import React from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Button } from '@ui/Button'
import { ProgressBar } from '@ui/ProgressBar'
import { colors } from '@theme'
import { styles } from './styles'

export interface StepperHeaderProps {
  /** Rang de l'étape courante (1 pour le premier item). `null` sur la relecture. */
  current: number | null
  total: number
  /** Compteur déjà formaté (« 8 / 10 »). Vide sur la relecture. */
  countLabel: string
  /** Titre affiché à la place de la progression, sur la relecture. */
  title?: string
  backLabel: string
  onBack: () => void
  accentColor?: string
}

const BACK_ICON = <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />

/**
 * En-tête du parcours : retour, progression, compteur. Le retour est toujours
 * accessible, y compris sur le premier item, pour qu'un faux contact reste
 * rattrapable.
 */
export const StepperHeader = React.memo(function StepperHeader({
  current, total, countLabel, title, backLabel, onBack, accentColor,
}: StepperHeaderProps) {
  return (
    <View style={styles.header}>
      <Button variant="ghost" onPress={onBack} accessibilityLabel={backLabel} iconLeft={BACK_ICON} />
      {title != null ? (
        <Text style={styles.headerTitle}>{title}</Text>
      ) : (
        <>
          <ProgressBar
            value={current ?? 0}
            max={total}
            color={accentColor}
            style={styles.headerBar}
            testID="stepper-progress"
          />
          <Text style={styles.headerCount}>{countLabel}</Text>
        </>
      )}
    </View>
  )
})
