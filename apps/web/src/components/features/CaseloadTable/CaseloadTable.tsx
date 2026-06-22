import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardList, ExternalLink, Star, User } from 'lucide-react'
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
// Référence stable pour l'absence de modules (préserve le memo de RowDetail).
const EMPTY_MODULES: readonly string[] = []

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
  // Onglet ouvert à l'ouverture du panneau (selon le point d'entrée : chevron vs « +N »).
  const [drawerTab, setDrawerTab] = useState('actions')

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

  const toggleSelected = useCallback((id: string) => {
    setDrawerTab('actions')
    setSelectedId(prev => (prev === id ? null : id))
  }, [])
  // Ouverture ciblée sur l'onglet « Soins » (depuis le « +N » de la colonne Soins).
  const openModules = useCallback((id: string) => {
    setDrawerTab('soins')
    setSelectedId(id)
  }, [])
  const closePanel = useCallback(() => setSelectedId(null), [])

  // Le détail suit la donnée vivante : on relit depuis `visibleRows` à chaque rendu.
  // Si la ligne sort du filtre courant, le panneau se ferme de lui-même.
  const selectedRow = useMemo(
    () => (selectedId ? visibleRows.find(r => r.entry.id === selectedId) ?? null : null),
    [visibleRows, selectedId]
  )

  // Avatar du patient lié si disponible, sinon icône générique en repli.
  const drawerIcon = useMemo(
    () =>
      selectedRow?.patient_avatar_url ? (
        <img src={selectedRow.patient_avatar_url} alt="" className="caseload-drawer__avatar" />
      ) : (
        <User size={18} />
      ),
    [selectedRow?.patient_avatar_url]
  )

  // Patient de l'app lié au dossier ouvert (une seule recherche, réutilisée ci-dessous).
  const selectedPatient = useMemo(() => {
    const patientId = selectedRow?.entry.patient_id
    return patientId ? patients.find(p => p.id === patientId) ?? null : null
  }, [selectedRow, patients])

  // Modules débloqués du patient lié (onglet « Soins » du drawer).
  const selectedModules = selectedPatient?.moduleTypes ?? EMPTY_MODULES

  // Lien vers la fiche patient (uniquement pour un dossier relié à un compte patient).
  const drawerHeaderActions = useMemo(() => {
    if (!selectedPatient?.publicRef) return undefined
    return (
      <Link
        to={`/patient/${selectedPatient.publicRef}`}
        className="caseload-drawer__patient-link"
        title={t('file_active.open_patient')}
        aria-label={t('file_active.open_patient')}
      >
        <ExternalLink size={16} aria-hidden="true" />
      </Link>
    )
  }, [selectedPatient, t])

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
        cell: row => (
          <CareCell
            entry={row.entry}
            patients={patients}
            onPatch={onPatch}
            onOpen={() => openModules(row.entry.id)}
          />
        ),
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
    [t, today, patients, onPatch, onStatus, selectedId, toggleSelected, openModules]
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
          icon={drawerIcon}
          onClose={closePanel}
          storageKey="caseload-drawer-width"
          titleAccessory={<ImportantCell entry={selectedRow.entry} onPatch={onPatch} />}
          headerActions={drawerHeaderActions}
          topOffset={60}
          noPadding
        >
          <RowDetail
            row={selectedRow}
            today={today}
            moduleTypes={selectedModules}
            initialTab={drawerTab}
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
