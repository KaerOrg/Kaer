import { memo } from 'react'
import { View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button } from '@ui/Button'
import { colors } from '@theme'
import { hubStyles } from './hubStyles'

export interface ReminderRowProps {
  /** État du rappel, déjà formaté (« Rappel : tous les soirs à 21:00 »). */
  summary: string
  /** Libellé de l'action (« Modifier », ou « Créer un rappel » si aucun n'existe). */
  actionLabel: string
  onPress: () => void
}

/**
 * Ligne de rappel du hub. Opt-in : tant que le patient n'a rien créé, la ligne
 * propose la création. Elle n'est jamais imposée par l'objectif hebdomadaire.
 */
export const ReminderRow = memo(function ReminderRow({ summary, actionLabel, onPress }: ReminderRowProps) {
  return (
    <View style={hubStyles.reminderRow}>
      <MaterialCommunityIcons name="bell-outline" size={16} color={colors.textMuted} />
      <Text style={hubStyles.reminderText}>{summary}</Text>
      <Button
        variant="ghost"
        size="sm"
        label={actionLabel}
        onPress={onPress}
        accessibilityLabel={actionLabel}
        testID="breathing-reminder-action"
      />
    </View>
  )
})
