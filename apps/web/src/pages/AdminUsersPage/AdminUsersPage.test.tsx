import type { ReactNode } from 'react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockToast = { error: vi.fn(), success: vi.fn() }
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => mockToast }))

vi.mock('../../components/features/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('../../services/adminService', () => ({ fetchAllUsers: vi.fn() }))

// Coquille PatientDataRights : expose `onErased` via un bouton pour tester le retrait.
vi.mock('../../components/features/PatientDataRights', () => ({
  PatientDataRights: ({ patientId, onErased }: { patientId: string; displayName: string; onErased: () => void }) => (
    <button type="button" data-testid={`erase-${patientId}`} onClick={onErased}>
      erase
    </button>
  ),
}))

import { AdminUsersPage } from './AdminUsersPage'
import { fetchAllUsers } from '../../services/adminService'

const USERS = [
  { user_id: 'p1', kind: 'patient', email: 'ada@kaer.fr', display_name: 'Ada Lovelace', created_at: '2026-01-01T00:00:00Z', practitioner_names: ['Doc Gyneco'], is_admin: false },
  { user_id: 'p2', kind: 'patient', email: 'alan@kaer.fr', display_name: 'Alan Turing', created_at: '2026-01-02T00:00:00Z', practitioner_names: ['Doc Gyneco'], is_admin: false },
  { user_id: 'p3', kind: 'patient', email: 'marie@kaer.fr', display_name: 'Marie Curie', created_at: '2026-01-03T00:00:00Z', practitioner_names: ['Autre Doc'], is_admin: false },
  { user_id: 'd1', kind: 'practitioner', email: 'doc@kaer.fr', display_name: 'Doc Gyneco', created_at: '2026-01-04T00:00:00Z', practitioner_names: [], is_admin: true },
  { user_id: 'd2', kind: 'practitioner', email: 'autre@kaer.fr', display_name: 'Autre Doc', created_at: '2026-01-05T00:00:00Z', practitioner_names: [], is_admin: false },
] as const

beforeEach(() => vi.clearAllMocks())

function mockUsers() {
  vi.mocked(fetchAllUsers).mockResolvedValue({ ok: true, users: USERS as never })
}

// Rend la page enveloppée d'un QueryClient neuf (cache isolé, retry désactivé).
function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminUsersPage />
    </QueryClientProvider>,
  )
}

describe('AdminUsersPage', () => {
  it('liste patients ET médecins', async () => {
    mockUsers()
    renderPage()
    expect(await screen.findByText('ada@kaer.fr')).toBeInTheDocument()
    expect(screen.getByText('doc@kaer.fr')).toBeInTheDocument()
    // Badge de type présent pour les deux populations.
    expect(screen.getAllByText('Patient').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Médecin').length).toBeGreaterThan(0)
  })

  it('affiche une erreur et notifie si le chargement échoue', async () => {
    vi.mocked(fetchAllUsers).mockResolvedValue({ ok: false, message: 'admin_list_users: accès refusé' })
    renderPage()
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
    expect(screen.queryByText('ada@kaer.fr')).not.toBeInTheDocument()
  })

  it('filtre par type « Médecins »', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')

    fireEvent.click(screen.getByText('Médecins'))

    expect(screen.queryByText('ada@kaer.fr')).not.toBeInTheDocument()
    expect(screen.getByText('doc@kaer.fr')).toBeInTheDocument()
    expect(screen.getByText('autre@kaer.fr')).toBeInTheDocument()
  })

  it('recherche les patients par praticien', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')

    fireEvent.change(screen.getByLabelText('Filtrer par praticien'), { target: { value: 'Doc Gyneco' } })

    // Patients de Doc Gyneco visibles ; patient d'un autre médecin et médecins masqués.
    expect(screen.getByText('ada@kaer.fr')).toBeInTheDocument()
    expect(screen.getByText('alan@kaer.fr')).toBeInTheDocument()
    expect(screen.queryByText('marie@kaer.fr')).not.toBeInTheDocument()
    expect(screen.queryByText('doc@kaer.fr')).not.toBeInTheDocument()
  })

  it('retire le patient de la liste après un effacement réussi', async () => {
    mockUsers()
    renderPage()
    fireEvent.click(await screen.findByText('Ada Lovelace'))
    fireEvent.click(screen.getByTestId('erase-p1'))

    await waitFor(() => expect(screen.queryByText('ada@kaer.fr')).not.toBeInTheDocument())
    expect(screen.getByText('alan@kaer.fr')).toBeInTheDocument()
  })
})
