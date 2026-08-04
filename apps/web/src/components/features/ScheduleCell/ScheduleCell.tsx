import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Home, Stethoscope, Clock, Bell } from 'lucide-react'
import { Button } from '@ui/Button'
import type { ScheduleStatus } from '../../../lib/scaleScheduleStatus'
import './ScheduleCell.css'

interface ScheduleCellProps {
  readonly status: ScheduleStatus
  /** Ouvre l'encart Programmation (échelle auto « Non programmée »). */
  readonly onProgram: () => void
}

/**
 * Cellule « Programmée » du tableau des échelles (K-7). Affiche un **fait de calendrier**,
 * jamais un signal clinique : cadence + prochaine date pour une auto, « en séance · à la
 * demande » pour une hétéro, état « en retard » en **ambre administratif** (jamais rouge de
 * gravité, jamais dérivé d'un score — MDR 2017/745).
 */
export function ScheduleCell({ status, onProgram }: ScheduleCellProps) {
  const { t, i18n } = useTranslation()

  const handleProgram = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onProgram()
    },
    [onProgram],
  )

  if (status.kind === 'unscheduled') {
    return (
      <span className="schedule-cell schedule-cell--unscheduled">
        <span className="schedule-cell__none">{t('scales.programmed.unscheduled')}</span>
        <Button variant="outline" size="sm" onClick={handleProgram}>
          {t('scales.programmed.program_btn')}
        </Button>
      </span>
    )
  }

  if (status.kind === 'on_demand') {
    const inSession = status.mode === 'in_session'
    return (
      <span className="schedule-cell">
        {inSession ? <Stethoscope size={15} className="schedule-cell__icon" /> : <Home size={15} className="schedule-cell__icon" />}
        <span className="schedule-cell__text">
          {t(inSession ? 'scales.programmed.in_session' : 'scales.programmed.home_on_demand')}
        </span>
      </span>
    )
  }

  const freq = t(`scales.programmed.freq_${status.frequency}`)

  if (status.overdueDays > 0) {
    return (
      <span className="schedule-cell schedule-cell--overdue">
        <Clock size={15} className="schedule-cell__icon" />
        <span className="schedule-cell__text">
          {t('scales.programmed.home_overdue', { freq, days: status.overdueDays })}
        </span>
      </span>
    )
  }

  const date = new Date(`${status.nextDate}T12:00:00`).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' })
  return (
    <span className="schedule-cell">
      <Home size={15} className="schedule-cell__icon" />
      <span className="schedule-cell__text">{t('scales.programmed.home', { freq, date })}</span>
      {status.reminder ? <Bell size={13} className="schedule-cell__bell" aria-label={t('scales.programmed.reminder_label')} /> : null}
    </span>
  )
}
