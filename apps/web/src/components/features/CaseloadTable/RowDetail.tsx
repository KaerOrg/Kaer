import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListChecks, Clock, FileText, Smartphone } from 'lucide-react'
import { Tabs, type TabItem } from '../../ui/Tabs'
import { EmptyState } from '../../ui/EmptyState'
import { ActionList } from './ActionList'
import { WaitList } from './WaitList'
import { ModuleChips } from './ModuleChips'
import { ObservationBlock } from './ObservationBlock'
import type {
  CaseloadActionInput,
  CaseloadNote,
  CaseloadRowData,
  CaseloadWaitInput,
} from '../../../lib/caseload.types'

export interface RowDetailProps {
  row: CaseloadRowData
  today: string
  /** Modules débloqués du patient lié (lecture seule), affichés dans l'onglet « Soins ». */
  moduleTypes: readonly string[]
  /** Onglet ouvert à l'affichage (ex. « soins » quand on arrive via le « +N » de la colonne). */
  initialTab?: string
  onAddAction: (entryId: string, label: string, due: string | null) => void
  onToggleDone: (entryId: string, actionId: string, done: boolean) => void
  onPatchAction: (entryId: string, actionId: string, patch: CaseloadActionInput) => void
  onDeleteAction: (entryId: string, actionId: string) => void
  onAddWait: (entryId: string, label: string, relance: string | null) => void
  onPatchWait: (entryId: string, waitId: string, patch: CaseloadWaitInput) => void
  onDeleteWait: (entryId: string, waitId: string) => void
  onLoadNotes: (entryId: string) => Promise<readonly CaseloadNote[]>
  onAddNote: (entryId: string, body: string) => Promise<CaseloadNote | null>
}

/** Panneau dépliable d'un dossier : actions, attentes, observations. */
function RowDetailComponent({
  row,
  today,
  moduleTypes,
  initialTab = 'actions',
  onAddAction,
  onToggleDone,
  onPatchAction,
  onDeleteAction,
  onAddWait,
  onPatchWait,
  onDeleteWait,
  onLoadNotes,
  onAddNote,
}: RowDetailProps) {
  const { t } = useTranslation()
  const { entry, actions, waits } = row
  const [tab, setTab] = useState(initialTab)

  // Synchronise l'onglet quand l'ouverture cible explicitement une section (ex. « +N »
  // de la colonne Soins → onglet « soins », même si le drawer était déjà ouvert).
  useEffect(() => setTab(initialTab), [initialTab])

  const handleAdd = useCallback((label: string, due: string | null) => onAddAction(entry.id, label, due), [entry.id, onAddAction])
  const handleToggle = useCallback((actionId: string, done: boolean) => onToggleDone(entry.id, actionId, done), [entry.id, onToggleDone])
  const handlePatchAction = useCallback((actionId: string, patch: CaseloadActionInput) => onPatchAction(entry.id, actionId, patch), [entry.id, onPatchAction])
  const handleDeleteAction = useCallback((actionId: string) => onDeleteAction(entry.id, actionId), [entry.id, onDeleteAction])
  const handleAddWait = useCallback((label: string, relance: string | null) => onAddWait(entry.id, label, relance), [entry.id, onAddWait])
  const handlePatchWait = useCallback((waitId: string, patch: CaseloadWaitInput) => onPatchWait(entry.id, waitId, patch), [entry.id, onPatchWait])
  const handleDeleteWait = useCallback((waitId: string) => onDeleteWait(entry.id, waitId), [entry.id, onDeleteWait])

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'actions', label: t('file_active.section.actions'), icon: <ListChecks size={18} />, badge: actions.length || undefined },
      { id: 'waits', label: t('file_active.section.waits'), icon: <Clock size={18} />, badge: waits.length || undefined },
      { id: 'soins', label: t('file_active.section.soins'), icon: <Smartphone size={18} />, badge: moduleTypes.length || undefined },
      { id: 'observation', label: t('file_active.section.observation'), icon: <FileText size={18} /> },
    ],
    [t, actions.length, waits.length, moduleTypes.length]
  )

  const activeLabel = useMemo(() => tabs.find(tb => tb.id === tab)?.label ?? '', [tabs, tab])

  return (
    <div className="caseload-detail caseload-detail--tabbed">
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} variant="vertical" iconOnly />

      <div className="caseload-detail__panel">
        <h4 className="caseload-detail__panel-title">{activeLabel}</h4>

        {tab === 'actions' ? (
          <ActionList
            actions={actions}
            today={today}
            onAdd={handleAdd}
            onToggleDone={handleToggle}
            onPatchAction={handlePatchAction}
            onDeleteAction={handleDeleteAction}
          />
        ) : null}

        {tab === 'waits' ? (
          <WaitList waits={waits} onAdd={handleAddWait} onPatch={handlePatchWait} onDelete={handleDeleteWait} />
        ) : null}

        {tab === 'soins' ? (
          moduleTypes.length > 0 ? (
            <ModuleChips moduleTypes={moduleTypes} />
          ) : (
            <EmptyState icon={<Smartphone size={28} />} title={t('file_active.section.soins_empty')} />
          )
        ) : null}

        {tab === 'observation' ? (
          <ObservationBlock entryId={entry.id} onLoadNotes={onLoadNotes} onAddNote={onAddNote} />
        ) : null}
      </div>
    </div>
  )
}

export const RowDetail = memo(RowDetailComponent)
