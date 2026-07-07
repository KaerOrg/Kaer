import React from 'react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockUseConfigVersion = vi.fn()
vi.mock('./useConfigVersion', () => ({
  useConfigVersion: (enabled?: boolean) => mockUseConfigVersion(enabled),
}))

import { useConfigCacheSync } from './useConfigCacheSync'

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => vi.clearAllMocks())

describe('useConfigCacheSync', () => {
  it('n\'invalide pas au premier chargement (undefined → première version)', async () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    mockUseConfigVersion.mockReturnValue('v1')

    renderHook(() => useConfigCacheSync(), { wrapper: makeWrapper(client) })

    await waitFor(() => expect(mockUseConfigVersion).toHaveBeenCalled())
    expect(spy).not.toHaveBeenCalled()
  })

  it('invalide les queries configScoped quand le jeton change', async () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    mockUseConfigVersion.mockReturnValue('v1')

    const { rerender } = renderHook(() => useConfigCacheSync(), { wrapper: makeWrapper(client) })
    expect(spy).not.toHaveBeenCalled()

    mockUseConfigVersion.mockReturnValue('v2')
    rerender()

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    // Le prédicat ne cible que les queries marquées configScoped.
    const predicate = spy.mock.calls[0][0]?.predicate
    expect(predicate).toBeTypeOf('function')
    expect(predicate!({ meta: { configScoped: true } } as never)).toBe(true)
    expect(predicate!({ meta: undefined } as never)).toBe(false)
  })

  it('reste inerte tant que le jeton est undefined', async () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    mockUseConfigVersion.mockReturnValue(undefined)

    const { rerender } = renderHook(() => useConfigCacheSync(), { wrapper: makeWrapper(client) })
    rerender()

    expect(spy).not.toHaveBeenCalled()
  })

  it('propage l\'état `enabled` à useConfigVersion (garde d\'auth)', () => {
    const client = new QueryClient()
    mockUseConfigVersion.mockReturnValue(undefined)

    renderHook(() => useConfigCacheSync(false), { wrapper: makeWrapper(client) })

    expect(mockUseConfigVersion).toHaveBeenCalledWith(false)
  })
})
