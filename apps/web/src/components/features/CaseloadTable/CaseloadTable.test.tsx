import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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

const defaultRow: CaseloadRowData = { entry: makeEntry(), actions: [makeAction()], waits: [], patient_avatar_url: null }
const noop = () => {}
const loadNotes = () => Promise.resolve([])
const addNote = () => Promise.resolve(null)

function renderTable(props: Partial<CaseloadTableProps> = {}) {
  return render(
    <MemoryRouter>
      <CaseloadTable
        rows={props.rows ?? [defaultRow]}
        today={TODAY}
        patients={props.patients ?? []}
        iconByModule={props.iconByModule ?? {}}
        onPatch={props.onPatch ?? noop}
        onStatus={props.onStatus ?? noop}
        onAddPatient={props.onAddPatient ?? noop}
        onAddAction={props.onAddAction ?? noop}
        onToggleDone={props.onToggleDone ?? noop}
        onPatchAction={props.onPatchAction ?? noop}
        onDeleteAction={props.onDeleteAction ?? noop}
        onAddWait={props.onAddWait ?? noop}
        onPatchWait={props.onPatchWait ?? noop}
        onDeleteWait={props.onDeleteWait ?? noop}
        onLoadNotes={props.onLoadNotes ?? loadNotes}
        onAddNote={props.onAddNote ?? addNote}
      />
    </MemoryRouter>
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
    const row: CaseloadRowData = { entry: makeEntry(), actions: [makeAction({ due_date: '2026-06-05' })], waits: [], patient_avatar_url: null }
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

  it('ajoute un patient via la modale (dropdown des patients existants)', async () => {
    const onAddPatient = vi.fn()
    const patients = [{ id: 'pat-9', publicRef: 'ref-9', name: 'Léa Martin', email: 'lea@x.fr', moduleTypes: [] }]
    renderTable({ onAddPatient, patients })
    // La modale est fermée tant qu'on n'a pas cliqué « Ajouter un patient ».
    expect(screen.queryByText('Choisir un patient à suivre…')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un patient' }))
    // Sélection du patient puis confirmation dans la modale.
    fireEvent.change(await screen.findByLabelText('Patient'), { target: { value: 'pat-9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(onAddPatient).toHaveBeenCalledWith('pat-9')
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

  it('ouvre le détail en cliquant sur le nom du patient', async () => {
    renderTable()
    expect(screen.queryByText('Aucune observation.')).toBeNull() // panneau fermé
    fireEvent.click(screen.getByText('Bernard Hugo'))
    fireEvent.click(await screen.findByRole('tab', { name: 'Observations' }))
    expect(await screen.findByText('Aucune observation.')).toBeInTheDocument() // onglet Observations
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
    fireEvent.click(await screen.findByRole('tab', { name: 'En attente de retour' }))
    fireEvent.change(await screen.findByLabelText('Nouvelle attente'), { target: { value: 'Retour ASE' } })
    fireEvent.click(screen.getByLabelText("Ajouter l'attente"))
    expect(onAddWait).toHaveBeenCalledWith('e-1', 'Retour ASE', null)
  })

  it('affiche les modules débloqués du patient lié dans « Soins en cours »', () => {
    const row: CaseloadRowData = { entry: makeEntry({ patient_id: 'pat-1' }), actions: [], waits: [], patient_avatar_url: null }
    const patients = [{ id: 'pat-1', publicRef: 'ref-1', name: 'Léa Martin', email: 'lea@x.fr', moduleTypes: ['phq9'] }]
    const { container } = renderTable({ rows: [row], patients })
    // chip module visible dans la colonne Soins (sans dépliage)
    expect(container.querySelector('.module-chips .chip')).not.toBeNull()
  })

  it('ouvre le drawer sur l\'onglet Soins via le « +N » et liste tous les modules', async () => {
    const modules = ['phq9', 'gad7', 'sleep_diary', 'beck_columns', 'mood_tracker', 'emotion_wheel', 'grounding']
    const row: CaseloadRowData = { entry: makeEntry({ patient_id: 'pat-1' }), actions: [], waits: [], patient_avatar_url: null }
    const patients = [{ id: 'pat-1', publicRef: 'ref-1', name: 'Léa', email: 'lea@x.fr', moduleTypes: modules }]
    renderTable({ rows: [row], patients })
    // colonne repliée : 6 chips + « +1 »
    fireEvent.click(screen.getByRole('button', { name: '+1' }))
    // drawer ouvert sur l'onglet Soins : les 7 modules sont listés (sans repli « +N »)
    await screen.findByRole('tab', { name: 'Soins' })
    const chips = document.querySelectorAll('.drawer__body .module-chips .chip')
    expect(chips).toHaveLength(7)
  })

  it('affiche un lien vers la fiche patient dans l\'en-tête du drawer (patient lié)', async () => {
    const row: CaseloadRowData = { entry: makeEntry({ patient_id: 'pat-1' }), actions: [], waits: [], patient_avatar_url: null }
    const patients = [{ id: 'pat-1', publicRef: 'ref-9', name: 'Léa', email: 'lea@x.fr', moduleTypes: [] }]
    renderTable({ rows: [row], patients })
    fireEvent.click(screen.getByText('Bernard Hugo'))
    const link = await screen.findByRole('link', { name: 'Ouvrir la fiche patient' })
    expect(link).toHaveAttribute('href', '/patient/ref-9')
  })
})
