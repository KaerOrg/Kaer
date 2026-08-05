import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../../components/ui/Card'
import { engagementQueries } from '../../../hooks/queries'
import { formatReminderDays, isReminderActive, DISPLAY_WEEK_DAY_KEYS } from './breathingReminderText'
import './BreathingReminderPanel.css'

interface Props {
  patientId: string
  locale: string
}

/**
 * Onglet Notifications du module respiration, **en lecture seule** (W3).
 *
 * Le rappel de pratique est créé et réglé par le patient dans son app (M1/M5). Le
 * praticien le lit, il ne l'édite pas : deux endroits qui pilotent la même chose,
 * c'est un endroit de trop, et l'ancien réglage praticien produisait des rappels que
 * le patient n'avait pas demandés.
 *
 * Ce n'est pas lui retirer son influence sur la pratique : elle passe par l'objectif
 * proposé (W0), qui est le bon levier parce qu'il se discute en séance.
 */
export function BreathingReminderPanel({ patientId, locale }: Props) {
  const { t } = useTranslation()
  const { data: reminder, isLoading } = useQuery(engagementQueries.breathingReminder(patientId))

  const dayLabels = useMemo(
    () => DISPLAY_WEEK_DAY_KEYS.map(key => t(`notifications.day_abbr_${key}`)),
    [t],
  )

  const active = isReminderActive(reminder ?? null)
  const days = reminder ? formatReminderDays(reminder.days, dayLabels) : ''

  return (
    <div className="breathing-reminder-panel">
      <p className="breathing-reminder-panel__intro">
        {t('patient.breathing_reminder_intro')}
      </p>

      <Card variant="outlined" header={{ title: t('patient.breathing_reminder_card_title') }}>
        {isLoading ? (
          <p className="breathing-reminder-panel__muted">{t('common.loading')}</p>
        ) : !active ? (
          <p className="breathing-reminder-panel__muted" data-testid="breathing-reminder-none">
            {t('patient.breathing_reminder_none_created')}
          </p>
        ) : (
          <dl className="breathing-reminder-panel__list" data-testid="breathing-reminder-detail">
            <div className="breathing-reminder-panel__row">
              <dt>{t('patient.breathing_reminder_state')}</dt>
              <dd className="breathing-reminder-panel__state">{t('patient.breathing_reminder_active')}</dd>
            </div>
            <div className="breathing-reminder-panel__row">
              <dt>{t('patient.breathing_reminder_time')}</dt>
              <dd>{reminder?.time}</dd>
            </div>
            <div className="breathing-reminder-panel__row">
              <dt>{t('patient.breathing_reminder_days')}</dt>
              <dd>{days}</dd>
            </div>
            <div className="breathing-reminder-panel__row">
              <dt>{t('patient.breathing_reminder_set_on')}</dt>
              <dd>
                {reminder != null && new Date(reminder.updatedAt).toLocaleDateString(locale, {
                  day: 'numeric', month: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </div>
  )
}
