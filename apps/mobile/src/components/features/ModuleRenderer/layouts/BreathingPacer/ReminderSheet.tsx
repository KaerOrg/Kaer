import { memo, useCallback, useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Sheet } from '@ui/Sheet'
import { Toggle } from '@ui/Toggle'
import { Button } from '@ui/Button'
import { TimePicker } from '@ui/TimePicker'
import { hubStyles } from './hubStyles'
import { DayChip } from './DayChip'
import { DISPLAY_WEEK_JS_DAYS, toggleReminderDay } from './weekDayOrder'
import type { LabelFn } from './types'

/** L'état d'un rappel, tel que la feuille le manipule et le remonte. */
export interface ReminderDraft {
  enabled: boolean
  /** « HH:MM », ou `null` quand aucune heure n'a été choisie. */
  time: string | null
  /** Jours au format `Date.getDay()` (0 = dimanche). */
  days: number[]
}

export interface ReminderSheetProps {
  visible: boolean
  /** État enregistré, sur lequel la feuille se (r)ouvre. */
  value: ReminderDraft
  onClose: () => void
  onSave: (draft: ReminderDraft) => void
  lbl: LabelFn
  /** Initiales des jours, en ordre d'affichage (lundi → dimanche). */
  dayLabels: readonly string[]
  /** `common.close`, `common.save`, `common.ok`, résolus par le layout. */
  closeLabel: string
  saveLabel: string
  confirmLabel: string
}

/** Heure proposée par défaut quand le patient crée son premier rappel. */
const DEFAULT_HOUR = 21

/**
 * Feuille de réglage du rappel : bascule, heure, jours. Entièrement opt-in et
 * réglé par le patient, jamais dérivé de l'objectif hebdomadaire.
 *
 * L'enregistrement reste possible sans jour coché : le rappel est alors simplement
 * désactivé côté planification (M5), sans message d'erreur qui culpabiliserait.
 */
export const ReminderSheet = memo(function ReminderSheet({
  visible, value, onClose, onSave, lbl, dayLabels, closeLabel, saveLabel, confirmLabel,
}: ReminderSheetProps) {
  const [draft, setDraft] = useState<ReminderDraft>(value)

  // La feuille se rouvre toujours sur l'état enregistré : un réglage abandonné
  // (fermeture par le voile) ne survit pas à la réouverture.
  useEffect(() => {
    if (visible) setDraft(value)
  }, [visible, value])

  const handleToggle = useCallback(
    (enabled: boolean) => setDraft(prev => ({ ...prev, enabled })),
    [],
  )
  const handleTime = useCallback(
    (time: string) => setDraft(prev => ({ ...prev, time: time === '' ? null : time })),
    [],
  )
  const handleDay = useCallback(
    (jsDay: number) => setDraft(prev => ({ ...prev, days: toggleReminderDay(prev.days, jsDay) })),
    [],
  )
  const handleSave = useCallback(() => onSave(draft), [onSave, draft])

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={closeLabel}
      title={lbl('reminder_sheet_title')}
      subtitle={lbl('reminder_sheet_note')}
      scrollable
      testID="breathing-reminder-sheet"
    >
      <Toggle
        value={draft.enabled}
        onValueChange={handleToggle}
        label={lbl('reminder_enable_label')}
        sublabel={lbl('reminder_enable_sublabel')}
        testID="breathing-reminder-toggle"
      />

      <TimePicker
        value={draft.time ?? ''}
        onChange={handleTime}
        label={lbl('reminder_time_label')}
        confirmLabel={confirmLabel}
        defaultHour={DEFAULT_HOUR}
        testID="breathing-reminder-time"
      />

      <View>
        <Text style={hubStyles.sheetLabel}>{lbl('reminder_days_label')}</Text>
        <View style={hubStyles.dayPicker}>
          {DISPLAY_WEEK_JS_DAYS.map((jsDay, index) => (
            <DayChip
              key={jsDay}
              jsDay={jsDay}
              label={dayLabels[index]}
              selected={draft.days.includes(jsDay)}
              onToggle={handleDay}
            />
          ))}
        </View>
      </View>

      <Button
        label={saveLabel}
        onPress={handleSave}
        accessibilityLabel={saveLabel}
        testID="breathing-reminder-save"
      />
    </Sheet>
  )
})
