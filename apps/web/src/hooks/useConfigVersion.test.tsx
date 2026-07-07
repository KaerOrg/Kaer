import React from 'react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const mockFetchConfigVersion = vi.fn()

vi.mock('@services/configVersionService', () => ({
  fetchConfigVersion: () => mockFetchConfigVersion(),
}))

import { configVersionQueries } from './queries/configVersionQueries'
import { useConfigVersion } from './useConfigVersion'

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => vi.clearAllMocks())

describe('configVersionQueries', () => {
  it('produit une clé canonique stable', () => {
    expect(configVersionQueries.current().queryKey).toEqual(['configVersion'])
  })
})

describe('useConfigVersion', () => {
  it('renvoie undefined pendant le chargement puis le jeton', async () => {
    mockFetchConfigVersion.mockResolvedValue('v-42')
    const { result } = renderHook(() => useConfigVersion(), { wrapper: wrapper() })

    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toBe('v-42'))
    expect(mockFetchConfigVersion).toHaveBeenCalledTimes(1)
  })

  it('déduplique : deux consommateurs de la même clé = un seul fetch', async () => {
    mockFetchConfigVersion.mockResolvedValue('v-7')
    const { result } = renderHook(
      () => {
        const a = useQuery(configVersionQueries.current())
        const b = useQuery(configVersionQueries.current())
        return { a, b }
      },
      { wrapper: wrapper() }
    )

    await waitFor(() => expect(result.current.a.isSuccess).toBe(true))
    expect(result.current.b.data).toBe('v-7')
    expect(mockFetchConfigVersion).toHaveBeenCalledTimes(1)
  })
})
