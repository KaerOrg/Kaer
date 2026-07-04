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

  it('déclenche onChange à la réception d\'un événement', () => {
    const onChange = vi.fn()
    subscribePatientEntries('pt1', onChange)
    // Le 3e argument de .on est le callback Realtime — le simuler.
    const realtimeCallback = mockOn.mock.calls[0][2] as () => void
    realtimeCallback()

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('renvoie une fonction de désabonnement qui retire le canal', () => {
    const unsubscribe = subscribePatientEntries('pt1', () => {})
    expect(mockRemoveChannel).not.toHaveBeenCalled()

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelObj)
  })
})
