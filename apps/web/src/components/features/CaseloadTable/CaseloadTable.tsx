import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'
import { AddEntryForm, type AddEntryFormProps } from './AddEntryForm'
import { CaseloadFilters } from './CaseloadFilters'
import { CaseloadRow } from './CaseloadRow'
import { selectCaseloadRows } from './filterCaseload'
import { EMPTY_FILTER, type CaseloadFilterState, type LinkablePatient } from './types'
import type {
  CaseloadActionInput,
  CaseloadEntryInput,
  CaseloadRowData,
  CaseloadStatus,
  CaseloadWaitInput,
} from '../../../lib/caseload.types'
import './CaseloadTable.css'

export interface CaseloadTableProps {
  rows: readonly CaseloadRowData[]
  today: string
  patients: readonly LinkablePatient[]
  onPatch: (id: string, patch: CaseloadEntryInput) => void
  onStatus: (id: string, status: CaseloadStatus) => void
  onCreate: AddEntryFormProps['onCreate']
  onAddAction: (entryId: string, label: string, due: string | null) => void
  onToggleDone: (entryId: string, actionId: string, done: boolean) => void
  onPatchAction: (entryId: string, actionId: string, patch: CaseloadActionInput) => void
  onDeleteAction: (entryId: string, actionId: string) => void
  onAddWait: (entryId: string, label: string, relance: string | null) => void
  onPatchWait: (entryId: string, waitId: string, patch: CaseloadWaitInput) => void
  onDeleteWait: (entryId: string, waitId: string) => void
  creating?: boolean
}

const COLUMNS = ['patient', 'status', 'important', 'actions', 'care_pathways', 'waiting', 'alert'] as const

export function CaseloadTable({
  rows,
  today,
  patients,
  onPatch,
  onStatus,
  onCreate,
  onAddAction,
  onToggleDone,
  onPatchAction,
  onDeleteAction,
  onAddWait,
  onPatchWait,
  onDeleteWait,
  creating,
}: CaseloadTableProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<CaseloadFilterState>(EMPTY_FILTER)

  const visibleRows = useMemo(() => selectCaseloadRows(rows, filter, today), [rows, filter, today])

  return (
    <div className="caseload-table-wrap">
      <AddEntryForm onCreate={onCreate} loading={creating} />
      <CaseloadFilters value={filter} onChange={setFilter} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={t('file_active.empty.title')}
          description={t('file_active.empty.description')}
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={t('file_active.empty.no_match_title')}
          description={t('file_active.empty.no_match_description')}
        />
      ) : (
        <div className="caseload-table-scroll">
          <table className="caseload-table">
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th key={col} className={`caseload-th caseload-th--${col}`}>
                    {t(`file_active.col.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(row => (
                <CaseloadRow
                  key={row.entry.id}
                  row={row}
                  today={today}
                  patients={patients}
                  onPatch={onPatch}
                  onStatus={onStatus}
                  onAddAction={onAddAction}
                  onToggleDone={onToggleDone}
                  onPatchAction={onPatchAction}
                  onDeleteAction={onDeleteAction}
                  onAddWait={onAddWait}
                  onPatchWait={onPatchWait}
                  onDeleteWait={onDeleteWait}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
