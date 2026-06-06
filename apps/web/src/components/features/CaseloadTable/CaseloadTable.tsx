import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList } from 'lucide-react'
import { DataTable, type DataTableColumn } from '../../ui/DataTable'
import { EmptyState } from '../../ui/EmptyState'
import { computeEntryAlert } from '../../../lib/caseloadLogic'
import { AddEntryForm, type AddEntryFormProps } from './AddEntryForm'
import { CaseloadFilters } from './CaseloadFilters'
import { NameCell } from './NameCell'
import { StatusCell } from './StatusCell'
import { ImportantCell } from './ImportantCell'
import { ActionsSummaryCell } from './ActionsSummaryCell'
import { CareCell } from './CareCell'
import { AlertPill } from './AlertPill'
import { WaitSummary } from './WaitSummary'
import { RowDetail } from './RowDetail'
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

const getRowId = (row: CaseloadRowData) => row.entry.id
const rowClassName = (row: CaseloadRowData) =>
  row.entry.is_important ? 'caseload-row--important' : undefined

/**
 * Matrice « Ma file active » — câble le `DataTable` générique du design system
 * avec les colonnes et le panneau de détail propres au métier. Toute la
 * mécanique de table (en-têtes, scroll, dépliage, état vide) vient du DataTable ;
 * ce composant n'injecte que le contenu.
 */
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

  const columns = useMemo<DataTableColumn<CaseloadRowData>[]>(
    () => [
      {
        id: 'patient',
        header: t('file_active.col.patient'),
        headerClassName: 'caseload-th--patient',
        cellClassName: 'caseload-cell--name',
        cell: row => <NameCell entry={row.entry} onPatch={onPatch} />,
      },
      {
        id: 'status',
        header: t('file_active.col.status'),
        headerClassName: 'caseload-th--status',
        cell: row => <StatusCell id={row.entry.id} status={row.entry.status} onStatus={onStatus} />,
      },
      {
        id: 'important',
        header: t('file_active.col.important'),
        headerClassName: 'caseload-th--important',
        cellClassName: 'caseload-cell--important',
        cell: row => <ImportantCell entry={row.entry} onPatch={onPatch} />,
      },
      {
        id: 'actions',
        header: t('file_active.col.actions'),
        headerClassName: 'caseload-th--actions',
        cellClassName: 'caseload-cell--actions',
        cell: (row, ctx) => (
          <ActionsSummaryCell
            actions={row.actions}
            today={today}
            expanded={ctx.expanded}
            onToggle={ctx.toggleExpanded}
          />
        ),
      },
      {
        id: 'care_pathways',
        header: t('file_active.col.care_pathways'),
        headerClassName: 'caseload-th--care_pathways',
        cellClassName: 'caseload-cell--care',
        cell: row => <CareCell entry={row.entry} patients={patients} onPatch={onPatch} />,
      },
      {
        id: 'waiting',
        header: t('file_active.col.waiting'),
        headerClassName: 'caseload-th--waiting',
        cellClassName: 'caseload-cell--waiting',
        cell: row => <WaitSummary waits={row.waits} />,
      },
      {
        id: 'alert',
        header: t('file_active.col.alert'),
        headerClassName: 'caseload-th--alert',
        cellClassName: 'caseload-cell--alert',
        cell: row => <AlertPill level={computeEntryAlert(row.actions, today)} />,
      },
    ],
    [t, today, patients, onPatch, onStatus]
  )

  const renderDetail = useCallback(
    (row: CaseloadRowData) => (
      <RowDetail
        row={row}
        today={today}
        patients={patients}
        onPatch={onPatch}
        onAddAction={onAddAction}
        onToggleDone={onToggleDone}
        onPatchAction={onPatchAction}
        onDeleteAction={onDeleteAction}
        onAddWait={onAddWait}
        onPatchWait={onPatchWait}
        onDeleteWait={onDeleteWait}
      />
    ),
    [today, patients, onPatch, onAddAction, onToggleDone, onPatchAction, onDeleteAction, onAddWait, onPatchWait, onDeleteWait]
  )

  const toolbar = (
    <>
      <AddEntryForm onCreate={onCreate} loading={creating} />
      <CaseloadFilters value={filter} onChange={setFilter} />
    </>
  )

  const emptyState =
    rows.length === 0 ? (
      <EmptyState
        icon={<ClipboardList size={48} />}
        title={t('file_active.empty.title')}
        description={t('file_active.empty.description')}
      />
    ) : (
      <EmptyState
        icon={<ClipboardList size={48} />}
        title={t('file_active.empty.no_match_title')}
        description={t('file_active.empty.no_match_description')}
      />
    )

  return (
    <DataTable
      columns={columns}
      rows={visibleRows}
      getRowId={getRowId}
      toolbar={toolbar}
      renderDetail={renderDetail}
      rowClassName={rowClassName}
      emptyState={emptyState}
      ariaLabel={t('file_active.title')}
    />
  )
}
