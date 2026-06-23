import { memo, useState, useCallback } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { styles } from './TimePicker.styles'
import type { TimePickerProps } from './TimePicker.types'

const TIME_HHMM_RE = /^(\d{1,2}):(\d{2})$/

function parseHHMMToDate(value: string, defaultHour: number, defaultMinute: number): Date {
  const m = TIME_HHMM_RE.exec(value)
  const date = new Date()
  if (m) date.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
  else date.setHours(defaultHour, defaultMinute, 0, 0)
  return date
}

function formatDateToHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// Saisie d'une heure « HH:MM » : bouton à icône + DateTimePicker natif (spinner iOS
// avec confirmation, picker natif Android). Possède son propre état d'ouverture.
export const TimePicker = memo(function TimePicker({
  value,
  onChange,
  label,
  icon = 'clock-outline',
  placeholder,
  confirmLabel,
  hint,
  clearable = false,
  clearLabel,
  accent = colors.primary,
  defaultHour = 9,
  defaultMinute = 0,
  testID,
}: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const hasValue = value.length > 0

  const handleOpen = useCallback(() => setShowPicker(true), [])
  const handleConfirm = useCallback(() => setShowPicker(false), [])
  const handleClear = useCallback(() => onChange(''), [onChange])
  const handlePickerChange = useCallback((_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (date) onChange(formatDateToHHMM(date))
  }, [onChange])

  return (
    <View style={styles.container} testID={testID}>
      {(label != null || (clearable && hasValue)) ? (
        <View style={styles.labelRow}>
          {label != null ? <Text style={styles.label}>{label}</Text> : <View />}
          {clearable && hasValue ? (
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={clearLabel}
              testID={testID != null ? `${testID}-clear` : undefined}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Pressable
        style={[styles.button, !hasValue && styles.buttonEmpty]}
        onPress={handleOpen}
        accessibilityRole="button"
        testID={testID != null ? `${testID}-button` : undefined}
      >
        <MaterialCommunityIcons name={icon} size={20} color={hasValue ? accent : colors.textMuted} />
        {hasValue ? (
          <Text style={styles.value}>{value}</Text>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        {hint != null && hint !== '' ? <Text style={styles.hint}>{hint}</Text> : null}
      </Pressable>

      {showPicker ? (
        <DateTimePicker
          value={parseHHMMToDate(value, defaultHour, defaultMinute)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      ) : null}
      {showPicker && Platform.OS === 'ios' ? (
        <Pressable
          style={styles.confirm}
          onPress={handleConfirm}
          accessibilityRole="button"
          testID={testID != null ? `${testID}-confirm` : undefined}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
})
