import { memo } from 'react'
import { View, Text } from 'react-native'
import { ProgressBar } from '@ui/ProgressBar'
import { SESSION_COLORS, sessionStyles } from './sessionStyles'
import { formatClock } from './sessionPhases'

export interface SessionProgressProps {
  /** Secondes déjà pratiquées. */
  elapsedSeconds: number
  /** Durée choisie avant la session, en secondes. */
  plannedSeconds: number
  /** Libellé accessible de la jauge (i18n résolue par l'appelant). */
  accessibilityLabel: string
}

/**
 * Haut de l'écran de session : jauge fine de la durée choisie, et temps restant.
 * Restitution brute (MDR 2017/745) : un temps qui avance, sans commentaire.
 */
export const SessionProgress = memo(function SessionProgress({
  elapsedSeconds, plannedSeconds, accessibilityLabel,
}: SessionProgressProps) {
  return (
    <View style={sessionStyles.topRow}>
      <View style={sessionStyles.progressWrap}>
        <ProgressBar
          value={elapsedSeconds}
          max={plannedSeconds}
          color={SESSION_COLORS.text}
          trackColor={SESSION_COLORS.track}
          height={3}
          accessibilityLabel={accessibilityLabel}
          testID="session-progress"
        />
      </View>
      <Text style={sessionStyles.remaining} testID="session-remaining">
        {formatClock(plannedSeconds - elapsedSeconds)}
      </Text>
    </View>
  )
})
