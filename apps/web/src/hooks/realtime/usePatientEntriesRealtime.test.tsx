import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { PatientEntryChange } from '@services/patientRealtimeService'

// Le service est mocké : on capture le callback onChange et on expose l'unsubscribe.
type OnChange = (change: PatientEntryChange) => void
let capturedOnChange: OnChange | null = null
const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn((_patientId: string, onChange: OnChange) => {
  capturedOnChange = onChange
  return mockUnsubscribe
})
vi.mock('@services/patientRealtimeService', () => ({
  subscribePatientEntries: (patientId: string, onChange: OnChange) => mockSubscribe(patientId, onChange),
}))

/** Événement de test : la NATURE d'un changement, jamais son contenu. */
function change(over: Partial<PatientEntryChange> = {}): PatientEntryChange {
  return { eventType: 'INSERT', entryKind: 'scale_entry', moduleId: 'phq9', ...over }
}

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

    capturedOnChange?.(change())

    expect(spy).toHaveBeenCalledWith({ queryKey: ['engagement', 'evolution', 'pt1'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['engagement', 'moduleData', 'pt1'] })
    // Le détail des passations (#418) est rafraîchi par la même clé de factory.
    expect(spy).toHaveBeenCalledWith({ queryKey: ['engagement', 'scalePassations', 'pt1'] })
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

// ── Signal « nouvelle passation » (#423, QW-6) ──────────────────────────────

describe('usePatientEntriesRealtime : arrivée d\'une passation', () => {
  it('signale l\'arrivée d\'une passation, avec son module', () => {
    const onScaleEntry = vi.fn()
    renderHook(() => usePatientEntriesRealtime('pt1', onScaleEntry), {
      wrapper: makeWrapper(new QueryClient()),
    })

    capturedOnChange?.(change())

    expect(onScaleEntry).toHaveBeenCalledWith('phq9')
  })

  it('ignore une saisie qui n\'est pas une passation', () => {
    // Le bandeau annonce une PASSATION : une nuit de sommeil ne doit pas le déclencher.
    const onScaleEntry = vi.fn()
    renderHook(() => usePatientEntriesRealtime('pt1', onScaleEntry), {
      wrapper: makeWrapper(new QueryClient()),
    })

    capturedOnChange?.(change({ entryKind: 'sleep_diary_entry' }))

    expect(onScaleEntry).not.toHaveBeenCalled()
  })

  it('ne signale que l\'ARRIVÉE, jamais une modification ni une suppression', () => {
    const onScaleEntry = vi.fn()
    renderHook(() => usePatientEntriesRealtime('pt1', onScaleEntry), {
      wrapper: makeWrapper(new QueryClient()),
    })

    capturedOnChange?.(change({ eventType: 'UPDATE' }))
    capturedOnChange?.(change({ eventType: 'DELETE' }))

    expect(onScaleEntry).not.toHaveBeenCalled()
  })

  it('rafraîchit les données même sans callback de signal', () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    renderHook(() => usePatientEntriesRealtime('pt1'), { wrapper: makeWrapper(client) })

    capturedOnChange?.(change())

    expect(spy).toHaveBeenCalled()
  })

  it('ne rouvre PAS le canal quand le parent recrée le callback', () => {
    // Rouvrir perdrait les événements pendant la reconnexion, et le praticien
    // manquerait l'arrivée qu'il attend.
    const client = new QueryClient()
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => usePatientEntriesRealtime('pt1', cb),
      { wrapper: makeWrapper(client), initialProps: { cb: vi.fn() } },
    )
    expect(mockSubscribe).toHaveBeenCalledTimes(1)

    const next = vi.fn()
    rerender({ cb: next })

    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    // Et c'est bien le CALLBACK À JOUR qui est appelé.
    capturedOnChange?.(change())
    expect(next).toHaveBeenCalledTimes(1)
  })
})
