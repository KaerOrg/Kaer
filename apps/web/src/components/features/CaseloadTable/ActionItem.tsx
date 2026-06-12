import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '../../ui/Button'
import { describeDue } from './caseloadFormat'
import type { CaseloadAction, CaseloadActionInput } from '../../../lib/caseload.types'

export interface ActionItemProps {
  action: CaseloadAction
  today: string
  onToggleDone: (actionId: string, done: boolean) => void
  onPatch: (actionId: string, patch: CaseloadActionInput) => void
  onDelete: (actionId: string) => void
}

function ActionItemComponent({ action, today, onToggleDone, onPatch, onDelete }: ActionItemProps) {
  const { t } = useTranslation()
  const due = describeDue(action.due_date, today)
  const time = action.due_time ? action.due_time.slice(0, 5) : ''

  const handleLabelBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value.trim()
      if (!value) {
        e.target.value = action.label
        return
      }
      if (value !== action.label) onPatch(action.id, { label: value })
    },
    [action.id, action.label, onPatch]
  )

  const handleDueBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value || null
      if ((action.due_date ?? null) !== value) onPatch(action.id, { due_date: value })
    },
    [action.id, action.due_date, onPatch]
  )

  const handleTimeBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value || null
      if ((time || null) !== value) onPatch(action.id, { due_time: value })
    },
    [action.id, time, onPatch]
  )

  const handleToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onToggleDone(action.id, e.target.checked),
    [action.id, onToggleDone]
  )

  const handleDelete = useCallback(() => onDelete(action.id), [action.id, onDelete])

  const toggleUrgent = useCallback(
    () => onPatch(action.id, { is_urgent: !action.is_urgent }),
    [action.id, action.is_urgent, onPatch]
  )

  const dueText =
    due.kind === 'none'
      ? ''
      : t(`file_active.due.${due.kind}`, { count: due.kind === 'today' ? undefined : (due as { days: number }).days })
  const dueLabel = dueText ? `${dueText}${time ? ` ${time}` : ''}` : ''

  return (
    <div className={`action-item ${action.is_done ? 'action-item--done' : ''}`}>
      <input
        type="checkbox"
        className="action-item__check"
        checked={action.is_done}
        onChange={handleToggle}
        aria-label={t('file_active.action.done_label')}
      />
      <input
        key={`label-${action.label}`}
        className="action-item__label"
        defaultValue={action.label}
        onBlur={handleLabelBlur}
        aria-label={t('file_active.action.label_label')}
      />
      <input
        key={`due-${action.due_date ?? ''}`}
        type="date"
        className="action-item__due"
        defaultValue={action.due_date ?? ''}
        onBlur={handleDueBlur}
        aria-label={t('file_active.action.due_label')}
      />
      <input
        key={`time-${action.due_time ?? ''}`}
        type="time"
        className="action-item__time"
        defaultValue={time}
        onBlur={handleTimeBlur}
        aria-label={t('file_active.action.time_label')}
      />
      {dueLabel ? <span className={`action-item__due-label action-item__due-label--${due.kind}`}>{dueLabel}</span> : null}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        category="danger"
        className="action-item__urgent"
        icon={<AlertTriangle size={14} />}
        onClick={toggleUrgent}
        aria-pressed={action.is_urgent}
        aria-label={t('file_active.action.urgent_toggle')}
      />
      <Button
        type="button"
        variant="ghost"
        size="xs"
        category="danger"
        className="action-item__delete"
        icon={<Trash2 size={14} />}
        onClick={handleDelete}
        aria-label={t('file_active.action.delete_label')}
      />
    </div>
  )
}

export const ActionItem = memo(ActionItemComponent)
