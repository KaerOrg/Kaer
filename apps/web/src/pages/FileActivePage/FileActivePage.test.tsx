import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { CaseloadRowData } from '../../lib/caseload.types'
import { renderWithClient } from '../../test/renderWithClient'
import { FileActivePage } from './FileActivePage'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ practitioner: { id: 'pr1' } }),
}))
const mockToastError = vi.fn()
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ error: mockToastError, success: vi.fn() }),
}))
vi.mock('../../components/features/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// CaseloadTable est mocké : on expose les props qui nous intéressent (rows +
// un handler) pour piloter le test sans monter toute la table.
let lastProps: { rows: CaseloadRowData[]; onPatch: (id: string, patch: unknown) => Promise<void> } | null = null
vi.mock('../../components/features/CaseloadTable', () => ({
  CaseloadTable: (props: { rows: CaseloadRowData[]; onPatch: (id: string, patch: unknown) => Promise<void> }) => {
    lastProps = props
    return <div data-testid="caseload-table">{props.rows.length} rows</div>
  },
}))

const mockFetchCaseload = vi.fn()
const mockUpdateEntry = vi.fn()
vi.mock('@services/caseloadService', () => ({
  fetchCaseload: (...a: unknown[]) => mockFetchCaseload(...a),
  updateCaseloadEntry: (...a: unknown[]) => mockUpdateEntry(...a),
  createCaseloadEntry: vi.fn(), setCaseloadStatus: vi.fn(),
  createCaseloadAction: vi.fn(), updateCaseloadAction: vi.fn(), setActionDone: vi.fn(),
  deleteCaseloadAction: vi.fn(), createCaseloadWait: vi.fn(), updateCaseloadWait: vi.fn(),
  deleteCaseloadWait: vi.fn(), fetchCaseloadNotes: vi.fn(), createCaseloadNote: vi.fn(),
}))
vi.mock('@services/patientService', () => ({ fetchPatientsWithModules: vi.fn().mockResolvedValue([]) }))
vi.mock('@services/moduleCatalogService', () => ({ fetchModuleCategories: vi.fn().mockResolvedValue([]) }))

function makeRow(id: string): CaseloadRowData {
  return {
    entry: { id, status: 'active' } as CaseloadRowData['entry'],
    actions: [], waits: [],
  } as CaseloadRowData
}

beforeEach(() => {
  vi.clearAllMocks()
  lastProps = null
})

describe('FileActivePage — lecture via React Query', () => {
  it('charge la file active et la passe à la table', async () => {
    mockFetchCaseload.mockResolvedValue([makeRow('e1')])
    renderWithClient(<FileActivePage />)

    await waitFor(() => expect(mockFetchCaseload).toHaveBeenCalledWith('pr1', { includeArchived: true }))
    expect(await screen.findByText('1 rows')).toBeInTheDocument()
  })

  it('handlePatch met à jour le cache de façon optimiste (sans refetch)', async () => {
    mockFetchCaseload.mockResolvedValue([makeRow('e1')])
    mockUpdateEntry.mockResolvedValue({ ok: true, entry: { id: 'e1', status: 'active', display_name: 'Modifié' } })
    renderWithClient(<FileActivePage />)
    await screen.findByText('1 rows')
    const callsAfterLoad = mockFetchCaseload.mock.calls.length

    await lastProps!.onPatch('e1', { display_name: 'Modifié' })

    await waitFor(() => expect(mockUpdateEntry).toHaveBeenCalledWith('e1', { display_name: 'Modifié' }))
    // Mise à jour optimiste = pas de nouveau fetch de la liste.
    expect(mockFetchCaseload.mock.calls.length).toBe(callsAfterLoad)
  })

  it('handlePatch invalide (refetch) en cas d\'échec de l\'écriture', async () => {
    mockFetchCaseload.mockResolvedValue([makeRow('e1')])
    mockUpdateEntry.mockResolvedValue({ ok: false })
    renderWithClient(<FileActivePage />)
    await screen.findByText('1 rows')
    const callsAfterLoad = mockFetchCaseload.mock.calls.length

    await lastProps!.onPatch('e1', { display_name: 'X' })

    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    // Erreur → invalidation → refetch de la liste.
    await waitFor(() => expect(mockFetchCaseload.mock.calls.length).toBe(callsAfterLoad + 1))
  })
})
