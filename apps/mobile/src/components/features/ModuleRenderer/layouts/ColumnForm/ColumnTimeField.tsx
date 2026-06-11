// ─── column_time_field — TimePicker interactif optionnel ─────────────────────
//
// Champ de saisie d'heure « HH:MM » utilisé dans le layout `column_form`.
// Stockage : "HH:MM" (string) dans form_entries.values[key], '' si non renseigné.
// Props field_props : `key` (clé form_entries, requis), `optional` ('0'|'1', défaut '1').

import { memo, useState, useCallback } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { styles } from './styles'

const TIME_HHMM_RE = /^(\d{1,2}):(\d{2})$/

function parseHHMMToDate(value: string): Date {
  const m = TIME_HHMM_RE.exec(value)
  const date = new Date()
  if (m) {
    date.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
  } else {
    date.setHours(9, 0, 0, 0)
  }
  return date
}

function formatDateToHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export interface ColumnTimeFieldProps {
  fieldKey: string
  label: string
  value: string
  optional: boolean
  accent: string
  onChange: (next: string) => void
}

export const ColumnTimeField = memo(function ColumnTimeField({
  fieldKey,
  label,
  value,
  optional,
  accent,
  onChange,
}: ColumnTimeFieldProps) {
  const t = useModuleTranslation()
  const [showPicker, setShowPicker] = useState(false)
  const hasValue = value.length > 0

  const handleOpen = useCallback(() => {
    setShowPicker(true)
  }, [])

  const handlePickerChange = useCallback((_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (date) onChange(formatDateToHHMM(date))
  }, [onChange])

  const handleConfirm = useCallback(() => {
    setShowPicker(false)
  }, [])

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <View style={styles.timeContainer} testID={`time-${fieldKey}`}>
      <View style={styles.timeLabelRow}>
        {label ? <Text style={styles.timeLabel}>{label}</Text> : <View />}
        {optional && hasValue ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityLabel={t('common.delete')}
            testID={`time-${fieldKey}-clear`}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        style={[styles.timeButton, !hasValue && styles.timeButtonEmpty]}
        onPress={handleOpen}
        accessibilityRole="button"
        testID={`time-${fieldKey}-button`}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={20}
          color={hasValue ? accent : colors.textMuted}
        />
        {hasValue ? (
          <Text style={styles.timeValue}>{value}</Text>
        ) : (
          <Text style={styles.timePlaceholder}>{t('common.time_picker.tap_to_set')}</Text>
        )}
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={parseHHMMToDate(value)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      ) : null}
      {showPicker && Platform.OS === 'ios' ? (
        <Pressable
          style={styles.timeConfirm}
          onPress={handleConfirm}
          accessibilityRole="button"
          testID={`time-${fieldKey}-confirm`}
        >
          <Text style={styles.timeConfirmText}>{t('common.confirm')}</Text>
        </Pressable>
      ) : null}
    </View>
  )
})
