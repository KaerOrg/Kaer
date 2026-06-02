import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronDown, Star } from 'lucide-react'
import { computeEntryAlert, selectTopAction } from '../../../lib/caseloadLogic'
import { describeDue } from './caseloadFormat'
import { AlertPill } from './AlertPill'
import { CareTagsCell } from './CareTagsCell'
import { ModuleChips } from './ModuleChips'
import { ActionList } from './ActionList'
import { WaitSummary } from './WaitSummary'
import { WaitList } from './WaitList'
import { ObservationBlock } from './ObservationBlock'
import { PatientLinkControl } from './PatientLinkControl'
import type { LinkablePatient } from './types'
import type {
  CaseloadActionInput,
  CaseloadEntryInput,
  CaseloadRowData,
  CaseloadStatus,
  CaseloadWaitInput,
} from '../../../lib/caseload.types'

const STATUSES: readonly CaseloadStatus[] = ['active', 'paused', 'archived']
const COLUMN_COUNT = 7

export interface CaseloadRowProps {
  row: CaseloadRowData
  today: string
  patients: readonly LinkablePatient[]
  onPatch: (id: string, patch: CaseloadEntryInput) => void
  onStatus: (id: string, status: CaseloadStatus) => void
  onAddAction: (entryId: string, label: string, due: string | null) => void
  onToggleDone: (entryId: string, actionId: string, done: boolean) => void
  onPatchAction: (entryId: string, actionId: string, patch: CaseloadActionInput) => void
  onDeleteAction: (entryId: string, actionId: string) => void
  onAddWait: (entryId: string, label: string, relance: string | null) => void
  onPatchWait: (entryId: string, waitId: string, patch: CaseloadWaitInput) => void
  onDeleteWait: (entryId: string, waitId: string) => void
}

function CaseloadRowComponent({
  row,
  today,
  patients,
  onPatch,
  onStatus,
  onAddAction,
  onToggleDone,
  onPatchAction,
  onDeleteAction,
  onAddWait,
  onPatchWait,
  onDeleteWait,
}: CaseloadRowProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { entry, actions, waits } = row

  const linkedModules = entry.patient_id
    ? patients.find(p => p.id === entry.patient_id)?.moduleTypes ?? []
    : []

  const alert = computeEntryAlert(actions, today)
  const topAction = selectTopAction(actions, today)
  const openCount = actions.reduce((n, a) => (a.is_done ? n : n + 1), 0)
  const extraCount = topAction ? openCount - 1 : 0
  const topDue = describeDue(topAction?.due_date ?? null, today)
  const topDueLabel =
    topDue.kind === 'none'
      ? ''
      : t(`file_active.due.${topDue.kind}`, { count: topDue.kind === 'today' ? undefined : (topDue as { days: number }).days })
  const topTime = topAction?.due_time ? topAction.due_time.slice(0, 5) : ''

  const toggleExpand = useCallback(() => setExpanded(v => !v), [])
  const toggleImportant = useCallback(
    () => onPatch(entry.id, { is_important: !entry.is_important }),
    [entry.id, entry.is_important, onPatch]
  )

  const handleName = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value.trim()
      if (!value) {
        e.target.value = entry.display_name
        return
      }
      if (value !== entry.display_name) onPatch(entry.id, { display_name: value })
    },
    [entry.id, entry.display_name, onPatch]
  )

  const handleCare = useCallback((next: string[]) => onPatch(entry.id, { care_pathways: next }), [entry.id, onPatch])
  const handleLink = useCallback((patientId: string | null) => onPatch(entry.id, { patient_id: patientId }), [entry.id, onPatch])
  const handleAdd = useCallback((label: string, due: string | null) => onAddAction(entry.id, label, due), [entry.id, onAddAction])
  const handleToggle = useCallback((actionId: string, done: boolean) => onToggleDone(entry.id, actionId, done), [entry.id, onToggleDone])
  const handlePatchAction = useCallback((actionId: string, patch: CaseloadActionInput) => onPatchAction(entry.id, actionId, patch), [entry.id, onPatchAction])
  const handleDeleteAction = useCallback((actionId: string) => onDeleteAction(entry.id, actionId), [entry.id, onDeleteAction])
  const handleAddWait = useCallback((label: string, relance: string | null) => onAddWait(entry.id, label, relance), [entry.id, onAddWait])
  const handlePatchWait = useCallback((waitId: string, patch: CaseloadWaitInput) => onPatchWait(entry.id, waitId, patch), [entry.id, onPatchWait])
  const handleDeleteWait = useCallback((waitId: string) => onDeleteWait(entry.id, waitId), [entry.id, onDeleteWait])

  return (
    <>
      <tr className={`caseload-row ${entry.is_important ? 'caseload-row--important' : ''}`}>
        <td className="caseload-cell caseload-cell--name">
          <input
            key={`name-${entry.display_name}`}
            className="caseload-input caseload-input--name"
            defaultValue={entry.display_name}
            onBlur={handleName}
            title={entry.display_name}
            aria-label={t('file_active.col.patient')}
          />
        </td>

        <td className="caseload-cell">
          <select
            className="caseload-select"
            value={entry.status}
            onChange={e => onStatus(entry.id, e.target.value as CaseloadStatus)}
            aria-label={t('file_active.col.status')}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{t(`file_active.status.${s}`)}</option>
            ))}
          </select>
        </td>

        <td className="caseload-cell caseload-cell--important">
          <button
            type="button"
            className={`important-star ${entry.is_important ? 'important-star--on' : ''}`}
            onClick={toggleImportant}
            aria-pressed={entry.is_important}
            aria-label={t('file_active.important.toggle')}
          >
            <Star size={18} fill={entry.is_important ? 'currentColor' : 'none'} />
          </button>
        </td>

        <td className="caseload-cell caseload-cell--actions">
          <button type="button" className="actions-summary" onClick={toggleExpand} aria-expanded={expanded}>
            <span className="actions-summary__chevron">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
            {topAction ? (
              <span className="actions-summary__top">
                <span className="actions-summary__label">{topAction.label}</span>
                {topDueLabel ? (
                  <span className={`actions-summary__due actions-summary__due--${topDue.kind}`}>
                    {topDueLabel}{topTime ? ` ${topTime}` : ''}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="actions-summary__empty">{t('file_active.action.none')}</span>
            )}
            {extraCount > 0 ? <span className="actions-summary__more">+{extraCount}</span> : null}
          </button>
        </td>

        <td className="caseload-cell caseload-cell--care">
          <CareTagsCell pathways={entry.care_pathways} onChange={handleCare} />
          <ModuleChips moduleTypes={linkedModules} />
        </td>

        <td className="caseload-cell caseload-cell--waiting">
          <WaitSummary waits={waits} />
        </td>

        <td className="caseload-cell caseload-cell--alert">
          <AlertPill level={alert} />
        </td>
      </tr>

      {expanded ? (
        <tr className="caseload-row-detail">
          <td colSpan={COLUMN_COUNT}>
            <div className="caseload-detail">
              <section className="caseload-detail__section">
                <h4 className="caseload-detail__title">{t('file_active.section.link')}</h4>
                <PatientLinkControl patientId={entry.patient_id} patients={patients} onLink={handleLink} />
              </section>

              <section className="caseload-detail__section">
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

              <section className="caseload-detail__section">
                <h4 className="caseload-detail__title">{t('file_active.section.waits')}</h4>
                <WaitList waits={waits} onAdd={handleAddWait} onPatch={handlePatchWait} onDelete={handleDeleteWait} />
              </section>

              <section className="caseload-detail__section">
                <h4 className="caseload-detail__title">{t('file_active.section.observation')}</h4>
                <ObservationBlock entryId={entry.id} />
              </section>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

export const CaseloadRow = memo(CaseloadRowComponent)
