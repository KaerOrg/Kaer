import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { BreathingReminder } from '@services/engagementService'
import {
  formatReminderDays, isReminderActive, DISPLAY_WEEK_DAY_KEYS,
} from '../tabs/breathingReminderText'

/**
 * Légende du rappel patient pour la carte « Moment de pratique » (W1), en une
 * phrase. `null` quand aucun rappel n'est réellement actif : l'appelant affiche
 * alors son propre texte d'absence.
 *
 * Le praticien lit ce réglage, il ne l'édite pas (W3) : la phrase dit qui l'a posé.
 */
export function useBreathingReminderSummary(reminder: BreathingReminder | null): string | null {
  const { t } = useTranslation()

  return useMemo(() => {
    if (!isReminderActive(reminder) || reminder == null) return null
    const dayLabels = DISPLAY_WEEK_DAY_KEYS.map(key => t(`notifications.day_abbr_${key}`))
    return t('patient.breathing_reminder_summary', {
      time: reminder.time,
      days: formatReminderDays(reminder.days, dayLabels),
    })
  }, [reminder, t])
}
