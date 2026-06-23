import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { styles } from './styles'

interface Props {
  count: number
  /** Libellé déjà interpolé (ex. « 5 jours de suivi »). */
  label: string
}

// Série de « jours renseignés » — gamification légère MDR-safe. Valorise l'acte
// de tenir le carnet, jamais la prise : masqué tant qu'aucune série n'est en cours.
export function StreakBadge({ count, label }: Props) {
  if (count <= 0) return null
  return (
    <View style={styles.streak} testID="streak-badge">
      <MaterialCommunityIcons name="fire" size={18} color={colors.warning} />
      <Text style={styles.streakText}>{label}</Text>
    </View>
  )
}
