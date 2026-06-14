import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { homeQueries } from './homeQueries'

const mockFetchUnlockedModules = jest.fn()
const mockFetchTodayRoutines = jest.fn()
jest.mock('../../services/homeService', () => ({
  fetchUnlockedModules: (id: string) => mockFetchUnlockedModules(id),
  fetchTodayRoutines: (id: string) => mockFetchTodayRoutines(id),
}))

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('homeQueries — clés', () => {
  it('produit des clés stables par patient', () => {
    expect(homeQueries.unlockedModules('p1').queryKey).toEqual(['home', 'unlockedModules', 'p1'])
    expect(homeQueries.todayRoutines('p1').queryKey).toEqual(['home', 'todayRoutines', 'p1'])
  })

  it('désactive la query quand patientId est indéfini', () => {
    expect(homeQueries.unlockedModules(undefined).enabled).toBe(false)
    expect(homeQueries.unlockedModules('p1').enabled).toBe(true)
  })
})

describe('homeQueries.unlockedModules', () => {
  beforeEach(() => jest.clearAllMocks())

  it('appelle fetchUnlockedModules et renvoie les données', async () => {
    mockFetchUnlockedModules.mockResolvedValue([{ id: 'm1' }])
    const { result } = renderHook(() => useQuery(homeQueries.unlockedModules('p1')), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetchUnlockedModules).toHaveBeenCalledWith('p1')
    expect(result.current.data).toEqual([{ id: 'm1' }])
  })

  it('ne fetche pas quand patientId est indéfini', () => {
    const { result } = renderHook(() => useQuery(homeQueries.unlockedModules(undefined)), { wrapper: makeWrapper() })
    expect(mockFetchUnlockedModules).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('homeQueries.todayRoutines', () => {
  beforeEach(() => jest.clearAllMocks())

  it('appelle fetchTodayRoutines et renvoie les données', async () => {
    mockFetchTodayRoutines.mockResolvedValue([{ id: 'r1' }])
    const { result } = renderHook(() => useQuery(homeQueries.todayRoutines('p1')), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetchTodayRoutines).toHaveBeenCalledWith('p1')
    expect(result.current.data).toEqual([{ id: 'r1' }])
  })

  it('ne fetche pas quand patientId est indéfini', () => {
    const { result } = renderHook(() => useQuery(homeQueries.todayRoutines(undefined)), { wrapper: makeWrapper() })
    expect(mockFetchTodayRoutines).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})
