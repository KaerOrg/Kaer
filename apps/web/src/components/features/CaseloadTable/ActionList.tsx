import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '../../ui/Button'
import { ActionItem } from './ActionItem'
import type { CaseloadAction, CaseloadActionInput } from '../../../lib/caseload.types'

export interface ActionListProps {
  actions: readonly CaseloadAction[]
  today: string
  onAdd: (label: string, due: string | null) => void
  onToggleDone: (actionId: string, done: boolean) => void
  onPatchAction: (actionId: string, patch: CaseloadActionInput) => void
  onDeleteAction: (actionId: string) => void
}

export function ActionList({ actions, today, onAdd, onToggleDone, onPatchAction, onDeleteAction }: ActionListProps) {
  const { t } = useTranslation()
  const labelRef = useRef<HTMLInputElement>(null)
  const dueRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const label = labelRef.current?.value.trim() ?? ''
      if (!label) {
        labelRef.current?.focus()
        return
      }
      onAdd(label, dueRef.current?.value || null)
      if (labelRef.current) labelRef.current.value = ''
      if (dueRef.current) dueRef.current.value = ''
      labelRef.current?.focus()
    },
    [onAdd]
  )

  return (
    <div className="action-list">
      {actions.length === 0 ? (
        <p className="action-list__empty">{t('file_active.action.empty')}</p>
      ) : (
        actions.map(action => (
          <ActionItem
            key={action.id}
            action={action}
            today={today}
            onToggleDone={onToggleDone}
            onPatch={onPatchAction}
            onDelete={onDeleteAction}
          />
        ))
      )}

      <form className="action-list__add" onSubmit={handleAdd}>
        <input
          ref={labelRef}
          className="action-list__add-label"
          placeholder={t('file_active.action.add_placeholder')}
          aria-label={t('file_active.action.add_label')}
        />
        <input
          ref={dueRef}
          type="date"
          className="action-list__add-due"
          aria-label={t('file_active.action.add_due_label')}
        />
        <Button type="submit" variant="outline" size="xs" icon={<Plus size={14} />} aria-label={t('file_active.action.add_submit')} />
      </form>
    </div>
  )
}
