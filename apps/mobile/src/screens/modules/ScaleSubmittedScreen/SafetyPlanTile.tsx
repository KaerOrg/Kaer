import React, { useCallback } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Card } from '@ui/Card'
import { colors } from '@theme'
import { styles } from './styles'

export interface SafetyPlanTileProps {
  title: string
  subtitle: string
  onPress: () => void
}

/**
 * Raccourci vers le plan de sécurité du patient, en tête des ressources (#411).
 *
 * Le composant ne décide pas de son affichage : le parent ne le rend que si le module
 * `crisis_plan` est déverrouillé. **Absent, jamais grisé** : sans plan débloqué, il n'y
 * a pas de plan à ouvrir, et une tuile inerte ne ferait que promettre ce qui n'existe
 * pas. Même doctrine que dans le module de crise.
 *
 * Conformité MDR : la condition d'affichage est une **configuration praticien**
 * (le module est-il attribué ?), jamais une donnée saisie par le patient.
 */
export const SafetyPlanTile = React.memo(function SafetyPlanTile({
  title, subtitle, onPress,
}: SafetyPlanTileProps) {
  const handlePress = useCallback(() => onPress(), [onPress])

  return (
    <Card
      onPress={handlePress}
      style={styles.planCard}
      accessibilityLabel={title}
      testID="safety-plan-tile"
    >
      <View style={styles.planText}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Card>
  )
})
