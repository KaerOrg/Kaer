import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ObservationBlock (monté au dépliage) charge ses notes et utilise le toast :
// on neutralise le réseau et le contexte pour le test de la matrice.
vi.mock('../../../services/caseloadService', () => ({
  fetchCaseloadNotes: vi.fn().mockResolvedValue([]),
  createCaseloadNote: vi.fn(),
}))
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))

import { CaseloadTable, type CaseloadTableProps } from './CaseloadTable'
import type { CaseloadAction, CaseloadEntry, CaseloadRowData } from '../../../lib/caseload.types'

const TODAY = '2026-06-02'

function makeEntry(overrides: Partial<CaseloadEntry> = {}): CaseloadEntry {
  return {
    id: 'e-1', practitioner_id: 'p-1', patient_id: null, display_name: 'Bernard Hugo',
    status: 'active', is_important: false, wake_date: null, invited_email: null,
    care_pathways: [], last_reviewed_at: null, created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z', archived_at: null, ...overrides,
  }
}

function makeAction(overrides: Partial<CaseloadAction> = {}): CaseloadAction {
  return {
    id: 'a-1', entry_id: 'e-1', practitioner_id: 'p-1', label: 'Renouvellement', due_date: '2026-05-30',
    due_time: null, is_urgent: false, is_done: false, done_at: null, recurrence_days: null, sort_order: 0,
    created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-01T10:00:00Z', ...overrides,
  }
}

const defaultRow: CaseloadRowData = { entry: makeEntry(), actions: [makeAction()], waits: [] }
const noop = () => {}

function renderTable(props: Partial<CaseloadTableProps> = {}) {
  return render(
    <CaseloadTable
      rows={props.rows ?? [defaultRow]}
      today={TODAY}
      patients={props.patients ?? []}
      onPatch={props.onPatch ?? noop}
      onStatus={props.onStatus ?? noop}
      onCreate={props.onCreate ?? noop}
      onAddAction={props.onAddAction ?? noop}
      onToggleDone={props.onToggleDone ?? noop}
      onPatchAction={props.onPatchAction ?? noop}
      onDeleteAction={props.onDeleteAction ?? noop}
      onAddWait={props.onAddWait ?? noop}
      onPatchWait={props.onPatchWait ?? noop}
      onDeleteWait={props.onDeleteWait ?? noop}
    />
  )
}

describe('CaseloadTable', () => {
  it('affiche un état vide sans dossier', () => {
    renderTable({ rows: [] })
    expect(screen.getByText("Aucun dossier pour l'instant")).toBeInTheDocument()
  })

  it('affiche le patient, l\'action la plus urgente et la pastille critique', () => {
    renderTable()
    expect(screen.getByText('Bernard Hugo')).toBeInTheDocument()
    expect(screen.getByText('Renouvellement')).toBeInTheDocument()
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('affiche le délai sur la pastille « À venir »', () => {
    const row: CaseloadRowData = { entry: makeEntry(), actions: [makeAction({ due_date: '2026-06-05' })], waits: [] }
    renderTable({ rows: [row] })
    expect(screen.getByText('À venir')).toBeInTheDocument()
    expect(screen.getByText('3 j')).toBeInTheDocument()
  })

  it('ne modifie le nom qu\'après clic sur le crayon puis validation', () => {
    const onPatch = vi.fn()
    renderTable({ onPatch })
    // par défaut : pas de champ de saisie du nom
    expect(screen.queryByDisplayValue('Bernard Hugo')).toBeNull()
    fireEvent.click(screen.getByLabelText('Modifier le nom'))
    const input = screen.getByDisplayValue('Bernard Hugo')
    fireEvent.change(input, { target: { value: 'Bernard H.' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onPatch).toHaveBeenCalledWith('e-1', { display_name: 'Bernard H.' })
  })

  it('appelle onCreate à la capture rapide', () => {
    const onCreate = vi.fn()
    renderTable({ onCreate })
    fireEvent.change(screen.getByLabelText('Nom du patient'), { target: { value: 'Léa Martin' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }))
    expect(onCreate).toHaveBeenCalledWith({ display_name: 'Léa Martin', action_label: null, action_due: null })
  })

  it('épingle un patient via l\'étoile Important', () => {
    const onPatch = vi.fn()
    renderTable({ onPatch })
    fireEvent.click(screen.getByRole('button', { name: 'Épingler ce patient (important)' }))
    expect(onPatch).toHaveBeenCalledWith('e-1', { is_important: true })
  })

  it('appelle onStatus au changement de statut', () => {
    const onStatus = vi.fn()
    renderTable({ onStatus })
    const rowSelect = screen.getAllByLabelText('Statut').find(
      el => el.tagName === 'SELECT' && (el as HTMLSelectElement).value === 'active'
    )
    fireEvent.change(rowSelect!, { target: { value: 'archived' } })
    expect(onStatus).toHaveBeenCalledWith('e-1', 'archived')
  })

  it('déplie la ligne et coche une action', async () => {
    const onToggleDone = vi.fn()
    renderTable({ onToggleDone })
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.click(await screen.findByLabelText('Marquer comme fait'))
    expect(onToggleDone).toHaveBeenCalledWith('e-1', 'a-1', true)
  })

  it('déplie la ligne et force une action en urgent', async () => {
    const onPatchAction = vi.fn()
    renderTable({ onPatchAction })
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.click(await screen.findByLabelText('Marquer cette action comme urgente'))
    expect(onPatchAction).toHaveBeenCalledWith('e-1', 'a-1', { is_urgent: true })
  })

  it('déplie la ligne et ajoute une attente de retour', async () => {
    const onAddWait = vi.fn()
    renderTable({ onAddWait })
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.change(await screen.findByLabelText('Nouvelle attente'), { target: { value: 'Retour ASE' } })
    fireEvent.click(screen.getByLabelText("Ajouter l'attente"))
    expect(onAddWait).toHaveBeenCalledWith('e-1', 'Retour ASE', null)
  })

  it('affiche le patient lié (statut) et ses modules débloqués', async () => {
    const row: CaseloadRowData = { entry: makeEntry({ patient_id: 'pat-1' }), actions: [], waits: [] }
    const patients = [{ id: 'pat-1', name: 'Léa Martin', email: 'lea@x.fr', moduleTypes: ['phq9'] }]
    const { container } = renderTable({ rows: [row], patients })
    // chip module visible dans la colonne Soins (sans dépliage)
    expect(container.querySelector('.module-chips .chip')).not.toBeNull()
    // le patient lié apparaît dans le panneau
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(await screen.findByText(/Léa Martin — lea@x\.fr/)).toBeInTheDocument()
  })

  it('affiche le statut « invité » pour un dossier issu d\'une invitation', async () => {
    const row: CaseloadRowData = { entry: makeEntry({ invited_email: 'tom@x.fr' }), actions: [], waits: [] }
    renderTable({ rows: [row] })
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(await screen.findByText(/tom@x\.fr/)).toBeInTheDocument()
  })
})
