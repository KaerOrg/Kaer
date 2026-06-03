import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { CaseloadWait, CaseloadWaitInput } from '../../../lib/caseload.types'

export interface WaitItemProps {
  wait: CaseloadWait
  onPatch: (waitId: string, patch: CaseloadWaitInput) => void
  onDelete: (waitId: string) => void
}

function WaitItemComponent({ wait, onPatch, onDelete }: WaitItemProps) {
  const { t } = useTranslation()

  const handleLabelBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value.trim()
      if (!value) {
        e.target.value = wait.label
        return
      }
      if (value !== wait.label) onPatch(wait.id, { label: value })
    },
    [wait.id, wait.label, onPatch]
  )

  const handleRelanceBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value || null
      if ((wait.relance_date ?? null) !== value) onPatch(wait.id, { relance_date: value })
    },
    [wait.id, wait.relance_date, onPatch]
  )

  const handleDelete = useCallback(() => onDelete(wait.id), [wait.id, onDelete])

  return (
    <div className="wait-item">
      <input
        key={`label-${wait.label}`}
        className="wait-item__label"
        defaultValue={wait.label}
        onBlur={handleLabelBlur}
        aria-label={t('file_active.wait.label_label')}
      />
      <span className="wait-item__relance-label">{t('file_active.wait.relance_prefix')}</span>
      <input
        key={`relance-${wait.relance_date ?? ''}`}
        type="date"
        className="wait-item__relance"
        defaultValue={wait.relance_date ?? ''}
        onBlur={handleRelanceBlur}
        aria-label={t('file_active.wait.relance_label')}
      />
      <button
        type="button"
        className="wait-item__delete"
        onClick={handleDelete}
        aria-label={t('file_active.wait.delete_label')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export const WaitItem = memo(WaitItemComponent)
