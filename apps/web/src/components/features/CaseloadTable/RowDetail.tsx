import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionList } from './ActionList'
import { WaitList } from './WaitList'
import { ObservationBlock } from './ObservationBlock'
import type {
  CaseloadActionInput,
  CaseloadRowData,
  CaseloadWaitInput,
} from '../../../lib/caseload.types'

export interface RowDetailProps {
  row: CaseloadRowData
  today: string
  onAddAction: (entryId: string, label: string, due: string | null) => void
  onToggleDone: (entryId: string, actionId: string, done: boolean) => void
  onPatchAction: (entryId: string, actionId: string, patch: CaseloadActionInput) => void
  onDeleteAction: (entryId: string, actionId: string) => void
  onAddWait: (entryId: string, label: string, relance: string | null) => void
  onPatchWait: (entryId: string, waitId: string, patch: CaseloadWaitInput) => void
  onDeleteWait: (entryId: string, waitId: string) => void
}

/** Panneau dépliable d'un dossier : actions, attentes, observations. */
function RowDetailComponent({
  row,
  today,
  onAddAction,
  onToggleDone,
  onPatchAction,
  onDeleteAction,
  onAddWait,
  onPatchWait,
  onDeleteWait,
}: RowDetailProps) {
  const { t } = useTranslation()
  const { entry, actions, waits } = row

  const handleAdd = useCallback((label: string, due: string | null) => onAddAction(entry.id, label, due), [entry.id, onAddAction])
  const handleToggle = useCallback((actionId: string, done: boolean) => onToggleDone(entry.id, actionId, done), [entry.id, onToggleDone])
  const handlePatchAction = useCallback((actionId: string, patch: CaseloadActionInput) => onPatchAction(entry.id, actionId, patch), [entry.id, onPatchAction])
  const handleDeleteAction = useCallback((actionId: string) => onDeleteAction(entry.id, actionId), [entry.id, onDeleteAction])
  const handleAddWait = useCallback((label: string, relance: string | null) => onAddWait(entry.id, label, relance), [entry.id, onAddWait])
  const handlePatchWait = useCallback((waitId: string, patch: CaseloadWaitInput) => onPatchWait(entry.id, waitId, patch), [entry.id, onPatchWait])
  const handleDeleteWait = useCallback((waitId: string) => onDeleteWait(entry.id, waitId), [entry.id, onDeleteWait])

  return (
    <div className="caseload-detail">
      <section className="caseload-detail__section caseload-detail__section--actions">
        <h4 className="caseload-detail__title">{t('file_active.section.actions')}</h4>
        <ActionList
          actions={actions}
          today={today}
          onAdd={handleAdd}
          onToggleDone={handleToggle}
          onPatchAction={handlePatchAction}
          onDeleteAction={handleDeleteAction}
        />
      </section>

      <section className="caseload-detail__section caseload-detail__section--waits">
        <h4 className="caseload-detail__title">{t('file_active.section.waits')}</h4>
        <WaitList waits={waits} onAdd={handleAddWait} onPatch={handlePatchWait} onDelete={handleDeleteWait} />
      </section>

      <section className="caseload-detail__section caseload-detail__section--observation">
        <h4 className="caseload-detail__title">{t('file_active.section.observation')}</h4>
        <ObservationBlock entryId={entry.id} />
      </section>
    </div>
  )
}

export const RowDetail = memo(RowDetailComponent)
