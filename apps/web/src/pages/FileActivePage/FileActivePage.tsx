import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../contexts/ToastContext'
import { Layout } from '../../components/features/Layout'
import { CaseloadTable } from '../../components/features/CaseloadTable'
import {
  fetchCaseload,
  createEntryWithFirstAction,
  updateCaseloadEntry,
  setCaseloadStatus,
  createCaseloadAction,
  updateCaseloadAction,
  setActionDone,
  deleteCaseloadAction,
  createCaseloadWait,
  updateCaseloadWait,
  deleteCaseloadWait,
  syncCaseloadWithPatients,
} from '../../services/caseloadService'
import { fetchPatientsWithModules } from '../../services/patientService'
import { fetchPendingInvitations } from '../../services/invitationService'
import type {
  CaseloadActionInput,
  CaseloadEntryInput,
  CaseloadRowData,
  CaseloadStatus,
  CaseloadWaitInput,
} from '../../lib/caseload.types'
import type { LinkablePatient } from '../../components/features/CaseloadTable/types'
import './FileActivePage.css'

export function FileActivePage() {
  const { practitioner } = useAuthStore()
  const { t } = useTranslation()
  const toast = useToast()
  const [rows, setRows] = useState<CaseloadRowData[]>([])
  const [patients, setPatients] = useState<LinkablePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const loadRows = useCallback(async () => {
    if (!practitioner) return
    const [initialRows, appPatients, pendingInvites] = await Promise.all([
      fetchCaseload(practitioner.id, { includeArchived: true }),
      fetchPatientsWithModules(practitioner.id),
      fetchPendingInvitations(practitioner.id),
    ])
    const linkable: LinkablePatient[] = appPatients.map(p => ({
      id: p.id,
      name: [p.patient_first_name, p.patient_last_name].filter(Boolean).join(' ') || p.patient_alias || p.email,
      email: p.email,
      moduleTypes: p.modules.map(m => m.module_type),
    }))
    // Auto : patients inscrits → dossier lié ; invitations en attente → dossier libre
    // (converti en lié à l'inscription). Idempotent.
    const { created, linked } = await syncCaseloadWithPatients(
      practitioner.id,
      linkable.map(p => ({ id: p.id, name: p.name, email: p.email })),
      pendingInvites.map(inv => ({
        email: inv.patient_email,
        name: [inv.patient_first_name, inv.patient_last_name].filter(Boolean).join(' ') || inv.patient_email,
      }))
    )
    setRows(created + linked > 0 ? await fetchCaseload(practitioner.id, { includeArchived: true }) : initialRows)
    setPatients(linkable)
    setLoading(false)
  }, [practitioner])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const handleCreate = useCallback(
    async (input: { display_name: string; action_label: string | null; action_due: string | null }) => {
      if (!practitioner) return
      setCreating(true)
      const result = await createEntryWithFirstAction(practitioner.id, {
        displayName: input.display_name,
        actionLabel: input.action_label ?? undefined,
        actionDue: input.action_due,
      })
      setCreating(false)
      if (!result.ok || !result.row) {
        toast.error(t('file_active.error_create'))
        return
      }
      const created = result.row
      setRows(prev => [...prev, created])
    },
    [practitioner, toast, t]
  )

  const handlePatch = useCallback(
    async (id: string, patch: CaseloadEntryInput) => {
      const result = await updateCaseloadEntry(id, patch)
      if (!result.ok || !result.entry) {
        toast.error(t('file_active.error_save'))
        loadRows()
        return
      }
      const entry = result.entry
      setRows(prev => prev.map(r => (r.entry.id === id ? { ...r, entry } : r)))
    },
    [toast, t, loadRows]
  )

  const handleStatus = useCallback(
    async (id: string, status: CaseloadStatus) => {
      const result = await setCaseloadStatus(id, status)
      if (!result.ok || !result.entry) {
        toast.error(t('file_active.error_save'))
        loadRows()
        return
      }
      const entry = result.entry
      // On garde le dossier en mémoire quel que soit le statut : le filtre « Tous »
      // masque les archivés, mais le filtre « Archivés » les retrouve (et permet de désarchiver).
      setRows(prev => prev.map(r => (r.entry.id === id ? { ...r, entry } : r)))
      if (entry.status === 'archived') toast.success(t('file_active.archived'))
    },
    [toast, t, loadRows]
  )

  const handleAddAction = useCallback(
    async (entryId: string, label: string, due: string | null) => {
      if (!practitioner) return
      const result = await createCaseloadAction(practitioner.id, entryId, { label, due_date: due })
      if (!result.ok || !result.action) {
        toast.error(t('file_active.error_save'))
        return
      }
      const action = result.action
      setRows(prev => prev.map(r => (r.entry.id === entryId ? { ...r, actions: [...r.actions, action] } : r)))
    },
    [practitioner, toast, t]
  )

  const handleToggleDone = useCallback(
    async (entryId: string, actionId: string, done: boolean) => {
      const result = await setActionDone(actionId, done)
      if (!result.ok || !result.action) {
        toast.error(t('file_active.error_save'))
        loadRows()
        return
      }
      const action = result.action
      setRows(prev =>
        prev.map(r => (r.entry.id === entryId ? { ...r, actions: r.actions.map(a => (a.id === actionId ? action : a)) } : r))
      )
    },
    [toast, t, loadRows]
  )

  const handlePatchAction = useCallback(
    async (entryId: string, actionId: string, patch: CaseloadActionInput) => {
      const result = await updateCaseloadAction(actionId, patch)
      if (!result.ok || !result.action) {
        toast.error(t('file_active.error_save'))
        loadRows()
        return
      }
      const action = result.action
      setRows(prev =>
        prev.map(r => (r.entry.id === entryId ? { ...r, actions: r.actions.map(a => (a.id === actionId ? action : a)) } : r))
      )
    },
    [toast, t, loadRows]
  )

  const handleDeleteAction = useCallback(
    async (entryId: string, actionId: string) => {
      const result = await deleteCaseloadAction(actionId)
      if (!result.ok) {
        toast.error(t('file_active.error_save'))
        return
      }
      setRows(prev =>
        prev.map(r => (r.entry.id === entryId ? { ...r, actions: r.actions.filter(a => a.id !== actionId) } : r))
      )
    },
    [toast, t]
  )

  const handleAddWait = useCallback(
    async (entryId: string, label: string, relance: string | null) => {
      if (!practitioner) return
      const result = await createCaseloadWait(practitioner.id, entryId, { label, relance_date: relance })
      if (!result.ok || !result.wait) {
        toast.error(t('file_active.error_save'))
        return
      }
      const wait = result.wait
      setRows(prev => prev.map(r => (r.entry.id === entryId ? { ...r, waits: [...r.waits, wait] } : r)))
    },
    [practitioner, toast, t]
  )

  const handlePatchWait = useCallback(
    async (entryId: string, waitId: string, patch: CaseloadWaitInput) => {
      const result = await updateCaseloadWait(waitId, patch)
      if (!result.ok || !result.wait) {
        toast.error(t('file_active.error_save'))
        loadRows()
        return
      }
      const wait = result.wait
      setRows(prev =>
        prev.map(r => (r.entry.id === entryId ? { ...r, waits: r.waits.map(w => (w.id === waitId ? wait : w)) } : r))
      )
    },
    [toast, t, loadRows]
  )

  const handleDeleteWait = useCallback(
    async (entryId: string, waitId: string) => {
      const result = await deleteCaseloadWait(waitId)
      if (!result.ok) {
        toast.error(t('file_active.error_save'))
        return
      }
      setRows(prev =>
        prev.map(r => (r.entry.id === entryId ? { ...r, waits: r.waits.filter(w => w.id !== waitId) } : r))
      )
    },
    [toast, t]
  )

  return (
    <Layout wide>
      <div className="file-active">
        <div className="file-active__header">
          <h1 className="file-active__title">{t('file_active.title')}</h1>
          <p className="file-active__subtitle">{t('file_active.subtitle')}</p>
        </div>

        {loading ? (
          <div className="file-active__loading">{t('common.loading')}</div>
        ) : (
          <CaseloadTable
            rows={rows}
            today={today}
            patients={patients}
            onPatch={handlePatch}
            onStatus={handleStatus}
            onCreate={handleCreate}
            onAddAction={handleAddAction}
            onToggleDone={handleToggleDone}
            onPatchAction={handlePatchAction}
            onDeleteAction={handleDeleteAction}
            onAddWait={handleAddWait}
            onPatchWait={handlePatchWait}
            onDeleteWait={handleDeleteWait}
            creating={creating}
          />
        )}
      </div>
    </Layout>
  )
}
