import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PatientNotesTab } from './PatientNotesTab'
import { saveNote, type PractitionerNote } from '@services/noteService'
import type { AppointmentWithPatient } from '../../../lib/calendar.types'
import type { AppointmentStatus } from '../../../lib/calendar.types'

// useToast lève hors d'un ToastProvider → stub.
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}))

// SpeechToTextButton tire des services audio (recorder), hors périmètre : stub.
vi.mock('@ui/SpeechToTextButton', () => ({
  SpeechToTextButton: () => <div data-testid="speech-btn" />,
}))

// On garde les helpers purs (selectableAppointmentsForNote, extract*) ; on n'override
// que les fonctions réseau.
vi.mock('@services/noteService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@services/noteService')>()
  return { ...actual, saveNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn() }
})

function makeAppt(id: string, offsetDays: number, status: AppointmentStatus = 'confirmed'): AppointmentWithPatient {
  const starts = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  return {
    id,
    practitioner_id: 'prac-1',
    patient_id: 'pat-1',
    starts_at: starts.toISOString(),
    ends_at: new Date(starts.getTime() + 60 * 60 * 1000).toISOString(),
    status,
    notes: null,
    created_at: starts.toISOString(),
    updated_at: starts.toISOString(),
    patient_display_name: 'Alex',
    patient_email: 'alex@example.com',
    patient_public_ref: 'ref-1',
  }
}

function makeNote(id: string, appointment_id: string | null, content: string): PractitionerNote {
  return {
    id,
    practitioner_id: 'prac-1',
    patient_id: 'pat-1',
    appointment_id,
    content,
    tags: [],
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z',
  }
}

function setup(overrides: Partial<Parameters<typeof PatientNotesTab>[0]> = {}) {
  const props = {
    patientId: 'pat-1',
    practitionerId: 'prac-1',
    initialNotes: [] as PractitionerNote[],
    appointments: [] as AppointmentWithPatient[],
    onNotesChange: vi.fn(),
    ...overrides,
  }
  render(<PatientNotesTab {...props} />)
  return props
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(saveNote).mockResolvedValue({ ok: true, note: makeNote('new', null, 'x') })
})

describe('PatientNotesTab : rattachement RDV', () => {
  it('affiche le rendez-vous rattaché sur une note liée', () => {
    const appt = makeAppt('appt-1', -2)
    setup({
      appointments: [appt],
      initialNotes: [makeNote('n-1', 'appt-1', 'Séance du jour')],
    })
    expect(screen.getByText(/Consultation du/)).toBeInTheDocument()
  })

  it('n\'affiche pas de RDV sur une note libre', () => {
    setup({
      appointments: [makeAppt('appt-1', -2)],
      initialNotes: [makeNote('n-1', null, 'Note libre')],
    })
    expect(screen.queryByText(/Consultation du/)).not.toBeInTheDocument()
  })

  it('ne montre pas le sélecteur de RDV quand le patient n\'a aucun rendez-vous', () => {
    setup({ appointments: [] })
    expect(screen.queryByLabelText('Consultation')).not.toBeInTheDocument()
  })

  it('enregistre une note sans RDV par défaut (appointment_id null)', () => {
    setup({ appointments: [makeAppt('appt-1', -2)] })
    fireEvent.change(screen.getByLabelText('Ajouter une note…'), { target: { value: 'Contenu libre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(saveNote).toHaveBeenCalledWith('prac-1', 'pat-1', 'Contenu libre', [], null)
  })

  it('enregistre une note avec le RDV sélectionné dans le sélecteur', () => {
    const appt = makeAppt('appt-1', -2)
    const label = new Date(appt.starts_at).toLocaleString('fr', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    setup({ appointments: [appt] })

    fireEvent.change(screen.getByLabelText('Ajouter une note…'), { target: { value: 'Bilan séance' } })
    fireEvent.click(screen.getByLabelText('Consultation'))
    fireEvent.pointerDown(screen.getByRole('option', { name: label }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(saveNote).toHaveBeenCalledWith('prac-1', 'pat-1', 'Bilan séance', [], 'appt-1')
  })

  it('filtre les notes sur « Notes libres » (sans RDV)', () => {
    setup({
      appointments: [makeAppt('appt-1', -2), makeAppt('appt-2', -5)],
      initialNotes: [
        makeNote('n-linked', 'appt-1', 'Note liée au RDV'),
        makeNote('n-free', null, 'Note totalement libre'),
      ],
    })

    expect(screen.getByText('Note liée au RDV')).toBeInTheDocument()
    expect(screen.getByText('Note totalement libre')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Filtrer par consultation'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'Notes libres (sans consultation)' }))

    expect(screen.queryByText('Note liée au RDV')).not.toBeInTheDocument()
    expect(screen.getByText('Note totalement libre')).toBeInTheDocument()
  })
})
