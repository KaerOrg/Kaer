import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Star, User } from 'lucide-react'
import { DataTable, type DataTableColumn, type DataTableSort } from '../../ui/DataTable'
import { Drawer } from '../../ui/Drawer'
import { EmptyState } from '../../ui/EmptyState'
import { AddEntryForm, type AddEntryFormProps } from './AddEntryForm'
import { CaseloadFilters } from './CaseloadFilters'
import { NameCell } from './NameCell'
import { StatusCell } from './StatusCell'
import { ImportantCell } from './ImportantCell'
import { ActionsSummaryCell } from './ActionsSummaryCell'
import { CareCell } from './CareCell'
import { AlertCell } from './AlertCell'
import { WaitSummary } from './WaitSummary'
import { RowDetail } from './RowDetail'
import { selectCaseloadRows } from './filterCaseload'
import {
  sortCaseloadRows,
  DEFAULT_SORT_DIRECTION,
  type CaseloadSort,
  type CaseloadSortColumn,
} from './sortCaseloadRows'
import { EMPTY_FILTER, type CaseloadFilterState, type LinkablePatient } from './types'
import type {
  CaseloadActionInput,
  CaseloadEntryInput,
  CaseloadNote,
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
  onLoadNotes: (entryId: string) => Promise<readonly CaseloadNote[]>
  onAddNote: (entryId: string, body: string) => Promise<CaseloadNote | null>
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
  onLoadNotes,
  onAddNote,
  creating,
}: CaseloadTableProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<CaseloadFilterState>(EMPTY_FILTER)
  // Tri choisi par le praticien (null = ordre par défaut « important + urgence »).
  const [sort, setSort] = useState<CaseloadSort | null>(null)
  // Dossier dont le détail est ouvert dans le panneau latéral (null = panneau fermé).
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Ordre par défaut (important épinglé + urgence) ; le tri utilisateur, s'il existe,
  // prime et réordonne le jeu déjà filtré.
  const visibleRows = useMemo(() => {
    const filtered = selectCaseloadRows(rows, filter, today)
    return sort ? sortCaseloadRows(filtered, sort, today) : filtered
  }, [rows, filter, today, sort])

  // Clic sur un en-tête triable : bascule asc/desc sur la même colonne, ou démarre
  // une nouvelle colonne avec son sens initial le plus utile.
  const handleSortChange = useCallback((column: string) => {
    const col = column as CaseloadSortColumn
    setSort(prev =>
      prev?.column === col
        ? { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: col, direction: DEFAULT_SORT_DIRECTION[col] }
    )
  }, [])

  const dataTableSort = useMemo<DataTableSort | undefined>(
    () => (sort ? { column: sort.column, direction: sort.direction } : undefined),
    [sort]
  )

  const toggleSelected = useCallback(
    (id: string) => setSelectedId(prev => (prev === id ? null : id)),
    []
  )
  const closePanel = useCallback(() => setSelectedId(null), [])

  // Le détail suit la donnée vivante : on relit depuis `visibleRows` à chaque rendu.
  // Si la ligne sort du filtre courant, le panneau se ferme de lui-même.
  const selectedRow = useMemo(
    () => (selectedId ? visibleRows.find(r => r.entry.id === selectedId) ?? null : null),
    [visibleRows, selectedId]
  )

  const columns = useMemo<DataTableColumn<CaseloadRowData>[]>(
    () => [
      {
        id: 'patient',
        header: t('file_active.col.patient'),
        headerClassName: 'caseload-th--patient',
        cellClassName: 'caseload-cell--name',
        sortable: true,
        cell: row => (
          <NameCell
            entry={row.entry}
            patients={patients}
            expanded={selectedId === row.entry.id}
            onToggle={() => toggleSelected(row.entry.id)}
            onPatch={onPatch}
          />
        ),
      },
      {
        id: 'status',
        header: t('file_active.col.status'),
        headerClassName: 'caseload-th--status',
        sortable: true,
        cell: row => <StatusCell id={row.entry.id} status={row.entry.status} onStatus={onStatus} />,
      },
      {
        id: 'important',
        header: <Star size={14} className="caseload-th__icon" aria-label={t('file_active.col.important')} />,
        headerClassName: 'caseload-th--important',
        cellClassName: 'caseload-cell--important',
        sortable: true,
        cell: row => <ImportantCell entry={row.entry} onPatch={onPatch} />,
      },
      {
        id: 'care_pathways',
        header: t('file_active.col.care_pathways'),
        headerClassName: 'caseload-th--care_pathways',
        cellClassName: 'caseload-cell--care',
        cell: row => <CareCell entry={row.entry} patients={patients} onPatch={onPatch} />,
      },
      {
        id: 'actions',
        header: t('file_active.col.actions'),
        headerClassName: 'caseload-th--actions',
        cellClassName: 'caseload-cell--actions',
        cell: row => <ActionsSummaryCell actions={row.actions} today={today} />,
      },
      {
        id: 'waiting',
        header: t('file_active.col.waiting'),
        headerClassName: 'caseload-th--waiting',
        cellClassName: 'caseload-cell--waiting',
        sortable: true,
        cell: row => <WaitSummary waits={row.waits} />,
      },
      {
        id: 'alert',
        header: t('file_active.col.alert'),
        headerClassName: 'caseload-th--alert',
        cellClassName: 'caseload-cell--alert',
        sortable: true,
        cell: row => <AlertCell actions={row.actions} today={today} />,
      },
    ],
    [t, today, patients, onPatch, onStatus, selectedId, toggleSelected]
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
    <>
      <DataTable
        columns={columns}
        rows={visibleRows}
        getRowId={getRowId}
        toolbar={toolbar}
        rowClassName={rowClassName}
        emptyState={emptyState}
        ariaLabel={t('file_active.title')}
        className="caseload-data-table"
        sort={dataTableSort}
        onSortChange={handleSortChange}
      />

      {selectedRow ? (
        <Drawer
          title={selectedRow.entry.display_name}
          icon={<User size={18} />}
          onClose={closePanel}
          storageKey="caseload-drawer-width"
          titleAccessory={<ImportantCell entry={selectedRow.entry} onPatch={onPatch} />}
          topOffset={60}
          noPadding
        >
          <RowDetail
            row={selectedRow}
            today={today}
            onAddAction={onAddAction}
            onToggleDone={onToggleDone}
            onPatchAction={onPatchAction}
            onDeleteAction={onDeleteAction}
            onAddWait={onAddWait}
            onPatchWait={onPatchWait}
            onDeleteWait={onDeleteWait}
            onLoadNotes={onLoadNotes}
            onAddNote={onAddNote}
          />
        </Drawer>
      ) : null}
    </>
  )
}
