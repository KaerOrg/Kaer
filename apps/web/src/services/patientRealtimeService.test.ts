import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

// Chaîne fluide : channel(name).on(...).subscribe() → renvoie l'objet canal.
const channelObj = { on: mockOn, subscribe: mockSubscribe }
mockOn.mockReturnValue(channelObj)
mockSubscribe.mockReturnValue(channelObj)
mockChannel.mockReturnValue(channelObj)

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: (name: string) => mockChannel(name),
    removeChannel: (ch: unknown) => mockRemoveChannel(ch),
  },
}))

import { subscribePatientEntries } from './patientRealtimeService'

beforeEach(() => {
  vi.clearAllMocks()
  mockOn.mockReturnValue(channelObj)
  mockSubscribe.mockReturnValue(channelObj)
  mockChannel.mockReturnValue(channelObj)
})

describe('subscribePatientEntries', () => {
  it('ouvre un canal filtré par patient_id sur postgres_changes', () => {
    subscribePatientEntries('pt1', () => {})

    expect(mockChannel).toHaveBeenCalledWith('patient_entries:pt1')
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'patient_entries',
        filter: 'patient_id=eq.pt1',
      }),
      expect.any(Function),
    )
    expect(mockSubscribe).toHaveBeenCalled()
  })

  /** Le 3ᵉ argument de `.on` est le callback Realtime : le simuler. */
  function emit(payload: Record<string, unknown>): void {
    const realtimeCallback = mockOn.mock.calls[0][2] as (p: Record<string, unknown>) => void
    realtimeCallback(payload)
  }

  it('déclenche onChange avec la NATURE du changement, jamais son contenu', () => {
    const onChange = vi.fn()
    subscribePatientEntries('pt1', onChange)

    emit({
      eventType: 'INSERT',
      // Le payload complet arrive du serveur ; le service ne doit en laisser passer
      // que l'espèce. Un abonné qui lirait les réponses franchirait la ligne MDR.
      new: { entry_kind: 'scale_entry', module_id: 'phq9', payload: { answers: [3, 3, 3] } },
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      eventType: 'INSERT',
      entryKind: 'scale_entry',
      moduleId: 'phq9',
    })
  })

  it('lit la ligne supprimée sur un DELETE', () => {
    const onChange = vi.fn()
    subscribePatientEntries('pt1', onChange)

    emit({ eventType: 'DELETE', old: { entry_kind: 'scale_entry', module_id: 'gad7' } })

    expect(onChange).toHaveBeenCalledWith({
      eventType: 'DELETE',
      entryKind: 'scale_entry',
      moduleId: 'gad7',
    })
  })

  it('signale quand même le changement si la ligne ne porte rien d\'exploitable', () => {
    // Le rafraîchissement des données ne doit pas dépendre de la forme du payload.
    const onChange = vi.fn()
    subscribePatientEntries('pt1', onChange)

    emit({ eventType: 'INSERT', new: {} })

    expect(onChange).toHaveBeenCalledWith({
      eventType: 'INSERT',
      entryKind: null,
      moduleId: null,
    })
  })

  it('renvoie une fonction de désabonnement qui retire le canal', () => {
    const unsubscribe = subscribePatientEntries('pt1', () => {})
    expect(mockRemoveChannel).not.toHaveBeenCalled()

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelObj)
  })
})
