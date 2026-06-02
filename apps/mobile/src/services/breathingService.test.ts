const mockSaveDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveBreathingSession: (...a: unknown[]) => mockSaveDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveBreathingSession } from './breathingService'

beforeEach(() => jest.clearAllMocks())

describe('breathingService', () => {
  it('saveBreathingSession : écrit SQLite puis enqueue breathing_session', async () => {
    const session = { id: 'bs-1', date: '2025-01-01', technique_key: 'coherence', duration_seconds: 300 }
    await saveBreathingSession(session)
    expect(mockSaveDb).toHaveBeenCalledWith(session)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'bs-1',
      module_id: 'breathing_techniques',
      entry_kind: 'breathing_session',
      operation: 'upsert',
      payload: expect.objectContaining({ technique_key: 'coherence', duration_seconds: 300 }),
    }))
  })

  it('SQLite est appelé avant enqueue', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
    await saveBreathingSession({ id: 'x', date: '2025-01-01', technique_key: 'abc', duration_seconds: 60 })
    expect(order[0]).toBe('db')
  })
})
