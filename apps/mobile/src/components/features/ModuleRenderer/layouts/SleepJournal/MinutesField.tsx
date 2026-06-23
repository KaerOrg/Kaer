// Champ de durée en minutes (latence, WASO, siestes) : saisie numérique bornée
// + conversion « = XhYY » d'appoint.

import { View, Text, TextInput } from 'react-native'
import { colors } from '@theme'
import { styles } from './styles'

export interface MinutesFieldProps {
  value: number
  max: number
  onChange: (n: number) => void
  unit: string
  conv: string | null
  testID: string
}

export function MinutesField({ value, max, onChange, unit, conv, testID }: MinutesFieldProps) {
  return (
    <View style={styles.minutesRow}>
      <TextInput
        style={styles.minutesInput}
        value={value > 0 ? String(value) : ''}
        onChangeText={(raw) => {
          const parsed = parseInt(raw, 10)
          if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= max) onChange(parsed)
          else if (raw === '') onChange(0)
        }}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.border}
        maxLength={3}
        returnKeyType="done"
        testID={testID}
      />
      <Text style={styles.minutesUnit}>{unit}</Text>
      {conv ? <Text style={styles.minutesConv}>{conv}</Text> : null}
    </View>
  )
}
