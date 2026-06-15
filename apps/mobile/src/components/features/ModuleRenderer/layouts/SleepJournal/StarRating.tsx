// Note 1 à N par icônes (qualité = étoiles, ressenti au réveil = soleils).
// Auto-évaluation du patient (son propre ressenti) : neutre côté MDR.

import { View, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { styles } from './styles'

export interface StarRatingProps {
  count: number
  value: number | null
  onSelect: (n: number) => void
  icon?: 'star' | 'weather-sunny'
  testIdPrefix: string
}

export function StarRating({ count, value, onSelect, icon = 'star', testIdPrefix }: StarRatingProps) {
  const filledIcon = icon === 'star' ? 'star' : 'weather-sunny'
  const emptyIcon = icon === 'star' ? 'star-outline' : 'weather-sunny'
  return (
    <View style={styles.starsBig}>
      {Array.from({ length: count }, (_, i) => {
        const n = i + 1
        const on = n <= (value ?? 0)
        return (
          <Pressable key={n} onPress={() => onSelect(n)} accessibilityRole="button" accessibilityLabel={String(n)} testID={`${testIdPrefix}-${n}`}>
            <MaterialCommunityIcons name={on ? filledIcon : emptyIcon} size={icon === 'star' ? 36 : 32} color={on ? colors.stars : colors.border} />
          </Pressable>
        )
      })}
    </View>
  )
}
