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

// Filtres / tri / pagination sont côté serveur : on mocke la couche service et on
// vérifie les PARAMÈTRES envoyés (la page ne filtre/trie plus en mémoire).
vi.mock('../../services/adminService', () => ({
  fetchUsers: vi.fn(),
  fetchPractitionerNames: vi.fn(),
}))

// Coquille PatientDataRights : expose `onErased` via un bouton pour tester le refetch.
vi.mock('../../components/features/PatientDataRights', () => ({
  PatientDataRights: ({ patientId, onErased }: { patientId: string; displayName: string; onErased: () => void }) => (
    <button type="button" data-testid={`erase-${patientId}`} onClick={onErased}>
      erase
    </button>
  ),
}))

import { AdminUsersPage } from './AdminUsersPage'
import { fetchUsers, fetchPractitionerNames, type AdminUser } from '../../services/adminService'

const USERS: readonly AdminUser[] = [
  { user_id: 'p1', kind: 'patient', email: 'ada@kaer.fr', display_name: 'Ada Lovelace', created_at: '2026-01-01T00:00:00Z', practitioner_names: ['Doc Gyneco'], is_admin: false },
  { user_id: 'd1', kind: 'practitioner', email: 'doc@kaer.fr', display_name: 'Doc Gyneco', created_at: '2026-01-04T00:00:00Z', practitioner_names: [], is_admin: true },
]

beforeEach(() => vi.clearAllMocks())

function mockUsers(total = USERS.length) {
  vi.mocked(fetchUsers).mockResolvedValue({ ok: true, data: { users: USERS, total } })
  vi.mocked(fetchPractitionerNames).mockResolvedValue(['Autre Doc', 'Doc Gyneco'])
}

function lastParams() {
  const calls = vi.mocked(fetchUsers).mock.calls
  return calls[calls.length - 1][0]
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminUsersPage />
    </QueryClientProvider>,
  )
}

describe('AdminUsersPage', () => {
  it('liste patients ET médecins renvoyés par le serveur', async () => {
    mockUsers()
    renderPage()
    expect(await screen.findByText('ada@kaer.fr')).toBeInTheDocument()
    expect(screen.getByText('doc@kaer.fr')).toBeInTheDocument()
    expect(screen.getAllByText('Patient').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Médecin').length).toBeGreaterThan(0)
  })

  it('charge par défaut trié par date décroissante, page 0, sans filtre', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')
    expect(lastParams()).toMatchObject({
      kind: null,
      practitioner: null,
      search: null,
      sort: 'created_at',
      dir: 'desc',
      limit: 150,
      offset: 0,
    })
  })

  it('affiche une erreur et notifie si le chargement échoue', async () => {
    vi.mocked(fetchUsers).mockResolvedValue({ ok: false, message: 'admin_list_users: accès refusé' })
    vi.mocked(fetchPractitionerNames).mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
    expect(screen.queryByText('ada@kaer.fr')).not.toBeInTheDocument()
  })

  it('le filtre « Médecins » envoie kind=practitioner au serveur', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')

    fireEvent.click(screen.getByText('Médecins'))

    await waitFor(() => expect(lastParams()).toMatchObject({ kind: 'practitioner' }))
  })

  it('n\'affiche le filtre praticien que lorsque « Patients » est sélectionné', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')

    // Type « Tous » par défaut → pas de filtre praticien.
    expect(screen.queryByLabelText('Filtrer par praticien')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Patients'))
    expect(await screen.findByLabelText('Filtrer par praticien')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filtrer par praticien'), { target: { value: 'Doc Gyneco' } })
    await waitFor(() => expect(lastParams()).toMatchObject({ kind: 'patient', practitioner: 'Doc Gyneco' }))
  })

  it('un clic sur l\'en-tête « Nom » trie côté serveur (display_name asc)', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')

    fireEvent.click(screen.getByRole('button', { name: 'Nom' }))

    await waitFor(() => expect(lastParams()).toMatchObject({ sort: 'display_name', dir: 'asc' }))
  })

  it('la page suivante envoie l\'offset correspondant', async () => {
    mockUsers(300) // 2 pages de 150
    renderPage()
    await screen.findByText('ada@kaer.fr')

    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }))

    await waitFor(() => expect(lastParams()).toMatchObject({ offset: 150 }))
  })

  it('recherche côté serveur après debounce', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')

    fireEvent.change(screen.getByLabelText('Rechercher par nom ou email…'), { target: { value: 'ada' } })

    await waitFor(() => expect(lastParams()).toMatchObject({ search: 'ada' }))
  })

  it('refetch après un effacement réussi', async () => {
    mockUsers()
    renderPage()
    await screen.findByText('ada@kaer.fr')
    const before = vi.mocked(fetchUsers).mock.calls.length

    fireEvent.click(screen.getByText('Ada Lovelace'))
    fireEvent.click(screen.getByTestId('erase-p1'))

    await waitFor(() => expect(vi.mocked(fetchUsers).mock.calls.length).toBeGreaterThan(before))
  })
})
