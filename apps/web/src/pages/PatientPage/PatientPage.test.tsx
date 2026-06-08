import type { ReactNode } from 'react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'

// ── Mocks ──────────────────────────────────────────────────────────────────

// `ref` (token URL) et navigate sont pilotés par test.
let mockRef: string | undefined = 'p_valid'
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useParams: () => ({ ref: mockRef }),
  useNavigate: () => mockNavigate,
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ practitioner: { id: 'p-1', email: 'dr@t.fr', name: 'Dr X' } }),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}))

// Couche de données — on ne teste ici que l'orchestration de la résolution.
vi.mock('../../services/patientRefService', () => ({ resolvePatientRef: vi.fn() }))
vi.mock('../../services/patientService', () => ({
  fetchPatientHeader: vi.fn(),
  setTeenMode: vi.fn(),
  saveGeneralNote: vi.fn(),
}))
vi.mock('../../services/moduleAssignmentService', () => ({
  fetchPatientModules: vi.fn(() => Promise.resolve([])),
}))
vi.mock('../../services/practitionerSettingsService', () => ({
  fetchEnabledModules: vi.fn(() => Promise.resolve(null)),
}))
vi.mock('../../services/moduleCatalogService', () => ({
  fetchModuleCategories: vi.fn(() => Promise.resolve([])),
  fetchComingSoonModuleIds: vi.fn(() => Promise.resolve(new Set())),
}))
vi.mock('../../services/moduleService', () => ({
  fetchPsychoCards: vi.fn(() => Promise.resolve([])),
}))
vi.mock('../../services/noteService', () => ({
  fetchNotes: vi.fn(() => Promise.resolve([])),
}))
vi.mock('../../services/appointmentService', () => ({
  fetchAppointmentsForPatient: vi.fn(() => Promise.resolve([])),
}))

// Coquilles : on isole la logique de PatientPage de ses enfants.
vi.mock('../../components/features/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('./tabs/PatientOverviewTab', () => ({ PatientOverviewTab: () => null }))
vi.mock('./tabs/PatientModulesTab', () => ({ PatientModulesTab: () => null }))
vi.mock('./tabs/PatientNotesTab', () => ({ PatientNotesTab: () => null }))
vi.mock('./tabs/PatientRdvTab', () => ({ PatientRdvTab: () => null }))
vi.mock('./tabs/PatientEvolutionTab', () => ({ PatientEvolutionTab: () => null }))

import { PatientPage } from './PatientPage'
import { resolvePatientRef } from '../../services/patientRefService'
import { fetchPatientHeader } from '../../services/patientService'

const HEADER = {
  email: 'p@t.fr',
  alias: null,
  firstName: 'Jean',
  lastName: 'Dupont',
  teenMode: false,
  enrolledAt: '2024-01-01T00:00:00Z',
  generalNote: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRef = 'p_valid'
  vi.mocked(fetchPatientHeader).mockResolvedValue(HEADER)
})

describe('PatientPage — résolution du token public', () => {
  it('résout le token vers le patient_id réel et charge le dossier', async () => {
    vi.mocked(resolvePatientRef).mockResolvedValue('pat-1')

    render(<PatientPage />)

    // Le token de l'URL est résolu, puis le header est chargé avec la VRAIE PK.
    await waitFor(() => {
      expect(resolvePatientRef).toHaveBeenCalledWith('p_valid')
      expect(fetchPatientHeader).toHaveBeenCalledWith('p-1', 'pat-1')
    })
    expect(mockNavigate).not.toHaveBeenCalledWith('/')
  })

  it('redirige vers / si le token est introuvable (ou relation d’un autre praticien)', async () => {
    vi.mocked(resolvePatientRef).mockResolvedValue(null)

    render(<PatientPage />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    expect(fetchPatientHeader).not.toHaveBeenCalled()
  })

  it('redirige vers / sans requêter si le token est absent de l’URL', async () => {
    mockRef = undefined

    render(<PatientPage />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    expect(resolvePatientRef).not.toHaveBeenCalled()
  })
})
