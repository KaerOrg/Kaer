import React from 'react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const mockFetchPatientsWithModules = vi.fn()
const mockFetchPendingInvitations = vi.fn()
const mockSendInvitation = vi.fn()
const mockFetchInviteCategories = vi.fn()

vi.mock('../../services/patientService', () => ({
  fetchPatientsWithModules: (id: string) => mockFetchPatientsWithModules(id),
}))
vi.mock('../../services/invitationService', () => ({
  fetchPendingInvitations: (id: string) => mockFetchPendingInvitations(id),
  sendInvitation: (draft: unknown) => mockSendInvitation(draft),
}))
vi.mock('../../services/moduleCatalogService', () => ({
  fetchInviteCategories: () => mockFetchInviteCategories(),
}))

import { dashboardQueries, useSendInvitation } from './dashboardQueries'

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => vi.clearAllMocks())

describe('dashboardQueries — clés et enabled', () => {
  it('produit des clés stables', () => {
    expect(dashboardQueries.patients('p1').queryKey).toEqual(['dashboard', 'patients', 'p1'])
    expect(dashboardQueries.pendingInvitations('p1').queryKey).toEqual(['dashboard', 'pendingInvitations', 'p1'])
    expect(dashboardQueries.inviteCategories().queryKey).toEqual(['dashboard', 'inviteCategories'])
  })

  it('désactive les queries paramétrées sans praticien', () => {
    expect(dashboardQueries.patients(undefined).enabled).toBe(false)
    expect(dashboardQueries.pendingInvitations(undefined).enabled).toBe(false)
  })
})

describe('dashboardQueries.patients', () => {
  it('appelle fetchPatientsWithModules avec le praticien', async () => {
    mockFetchPatientsWithModules.mockResolvedValue([{ id: 'pt1' }])
    const { result } = renderHook(() => useQuery(dashboardQueries.patients('p1')), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetchPatientsWithModules).toHaveBeenCalledWith('p1')
    expect(result.current.data).toEqual([{ id: 'pt1' }])
  })

  it('reste désactivée sans praticien', () => {
    const { result } = renderHook(() => useQuery(dashboardQueries.patients(undefined)), { wrapper: wrapper() })
    expect(mockFetchPatientsWithModules).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('dashboardQueries.pendingInvitations', () => {
  it('appelle fetchPendingInvitations', async () => {
    mockFetchPendingInvitations.mockResolvedValue([{ id: 'inv1' }])
    const { result } = renderHook(() => useQuery(dashboardQueries.pendingInvitations('p1')), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetchPendingInvitations).toHaveBeenCalledWith('p1')
  })
})

describe('dashboardQueries.inviteCategories', () => {
  it('appelle fetchInviteCategories', async () => {
    mockFetchInviteCategories.mockResolvedValue([{ id: 'cat1' }])
    const { result } = renderHook(() => useQuery(dashboardQueries.inviteCategories()), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetchInviteCategories).toHaveBeenCalled()
  })
})

describe('useSendInvitation', () => {
  it('appelle sendInvitation et résout le résultat', async () => {
    mockSendInvitation.mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useSendInvitation(), { wrapper: wrapper() })
    const draft = {
      practitionerId: 'p1', email: 'a@b.fr', firstName: null, lastName: null,
      birthDate: null, sex: null, teenMode: false, modules: [],
    }
    const res = await result.current.mutateAsync(draft)
    expect(mockSendInvitation).toHaveBeenCalledWith(draft)
    expect(res).toEqual({ ok: true })
  })
})
