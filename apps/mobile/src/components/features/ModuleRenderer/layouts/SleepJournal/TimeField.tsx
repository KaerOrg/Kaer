// Champ horaire de l'agenda du sommeil : bouton affichant l'heure + DateTimePicker
// natif (spinner iOS avec bouton de confirmation, picker natif Android).

import { View, Text, Pressable, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { toHHMM } from './sleepHelpers'
import { styles } from './styles'

export interface TimeFieldProps {
  label: string
  value: Date
  icon: 'bed-outline' | 'bed-empty' | 'clock-outline'
  hint: string
  show: boolean
  onOpen: () => void
  onClose: () => void
  onChange: (d: Date) => void
  confirmLabel: string
  testID: string
}

export function TimeField({ label, value, icon, hint, show, onOpen, onClose, onChange, confirmLabel, testID }: TimeFieldProps) {
  return (
    <View style={styles.timeFieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.timeBtn} onPress={onOpen} accessibilityRole="button" testID={testID}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} />
        <Text style={styles.timeValue}>{toHHMM(value)}</Text>
        {hint ? <Text style={styles.timeHint}>{hint}</Text> : null}
      </TouchableOpacity>
      {show ? (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS === 'android') onClose()
            if (date) onChange(date)
          }}
        />
      ) : null}
      {show && Platform.OS === 'ios' ? (
        <Pressable style={styles.confirmBtn} onPress={onClose}>
          <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
