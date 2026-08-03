import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFetchItems = vi.fn()
vi.mock('@services/safetyPlanItemsService', () => ({
  fetchSafetyPlanItems: (...a: unknown[]) => mockFetchItems(...a),
}))

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCrisisPlanSummary } from './useCrisisPlanSummary'
import type { PatientModule } from '../../../lib/database.types'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function crisisModule(): PatientModule {
  return {
    id: 'pm1',
    patient_id: 'p1',
    module_type: 'crisis_plan',
    unlocked_at: '2026-06-01T00:00:00Z',
    unlocked_by: 'pr1',
    config: null,
  }
}

function item(id: string) {
  return {
    id, section_id: 'step_1', text: 'Quand je ne dors plus',
    kind: null, role: null, note: null, phone: null,
    sort_order: 0, authored_by: 'patient', created_at: '', updated_at: '',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchItems.mockResolvedValue([])
})

describe('useCrisisPlanSummary', () => {
  it('un plan qui porte au moins un item est « personnalisé »', async () => {
    mockFetchItems.mockResolvedValue([item('a')])
    const { result } = renderHook(() => useCrisisPlanSummary('p1', [crisisModule()]), { wrapper })
    await waitFor(() => expect(result.current.isConfigured).toBe(true))
  })

  // C'était le problème d'origine du ticket #321 : trois mots dans le message de soutien
  // suffisaient à afficher « Plan personnalisé » sur un plan par ailleurs VIDE.
  it('un plan vide n\'est pas « personnalisé », quel que soit le message de soutien', async () => {
    mockFetchItems.mockResolvedValue([])
    const { result } = renderHook(() => useCrisisPlanSummary('p1', [crisisModule()]), { wrapper })
    await waitFor(() => expect(mockFetchItems).toHaveBeenCalled())
    expect(result.current.isConfigured).toBe(false)
  })

  it('module non déverrouillé : rien à déclarer, même si des items subsistent', async () => {
    mockFetchItems.mockResolvedValue([item('a')])
    const { result } = renderHook(() => useCrisisPlanSummary('p1', []), { wrapper })
    await waitFor(() => expect(mockFetchItems).toHaveBeenCalled())
    expect(result.current.isConfigured).toBe(false)
  })

  it('avant la réponse du serveur, ne déclare rien plutôt que de supposer', () => {
    const { result } = renderHook(() => useCrisisPlanSummary('p1', [crisisModule()]), { wrapper })
    expect(result.current.isConfigured).toBe(false)
  })

  it('une lecture en échec ne fait pas planter la carte', async () => {
    mockFetchItems.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useCrisisPlanSummary('p1', [crisisModule()]), { wrapper })
    await waitFor(() => expect(mockFetchItems).toHaveBeenCalled())
    expect(result.current.isConfigured).toBe(false)
  })
})
