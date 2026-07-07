import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Le service est mocké : on capture le callback onChange et on expose l'unsubscribe.
let capturedOnChange: (() => void) | null = null
const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn((_patientId: string, onChange: () => void) => {
  capturedOnChange = onChange
  return mockUnsubscribe
})
vi.mock('@services/patientRealtimeService', () => ({
  subscribePatientEntries: (patientId: string, onChange: () => void) => mockSubscribe(patientId, onChange),
}))

import { usePatientEntriesRealtime } from './usePatientEntriesRealtime'

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  capturedOnChange = null
})

describe('usePatientEntriesRealtime', () => {
  it('ne s\'abonne pas sans patientId', () => {
    const client = new QueryClient()
    renderHook(() => usePatientEntriesRealtime(null), { wrapper: makeWrapper(client) })
    expect(mockSubscribe).not.toHaveBeenCalled()
  })

  it('s\'abonne au patient et invalide les queries d\'engagement à l\'événement', () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    renderHook(() => usePatientEntriesRealtime('pt1'), { wrapper: makeWrapper(client) })

    expect(mockSubscribe).toHaveBeenCalledWith('pt1', expect.any(Function))

    capturedOnChange?.()

    expect(spy).toHaveBeenCalledWith({ queryKey: ['engagement', 'evolution', 'pt1'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['engagement', 'moduleData', 'pt1'] })
  })

  it('se désabonne au démontage', () => {
    const client = new QueryClient()
    const { unmount } = renderHook(() => usePatientEntriesRealtime('pt1'), { wrapper: makeWrapper(client) })
    expect(mockUnsubscribe).not.toHaveBeenCalled()

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('ferme l\'ancien canal avant d\'ouvrir le nouveau au changement de patient', () => {
    const client = new QueryClient()
    const { rerender } = renderHook(({ id }: { id: string }) => usePatientEntriesRealtime(id), {
      wrapper: makeWrapper(client),
      initialProps: { id: 'pt1' },
    })
    expect(mockSubscribe).toHaveBeenLastCalledWith('pt1', expect.any(Function))

    rerender({ id: 'pt2' })

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1) // ancien canal fermé
    expect(mockSubscribe).toHaveBeenLastCalledWith('pt2', expect.any(Function))
  })
})
