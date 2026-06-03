const mockGetAllDb = jest.fn().mockResolvedValue([])
const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  getAllMoodMarkers: (...a: unknown[]) => mockGetAllDb(...a),
  saveMoodMarker: (...a: unknown[]) => mockSaveDb(...a),
  deleteMoodMarker: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { getAllMoodMarkers, saveMoodMarker, deleteMoodMarker } from './moodMarkerService'

beforeEach(() => jest.clearAllMocks())

const marker = { id: 'm-1', date: '2025-05-30', label: 'Début lithium', created_at: '2025-05-30T10:00:00Z' }

describe('moodMarkerService', () => {
  it('getAllMoodMarkers : délègue à la base, sans enqueue (lecture seule)', async () => {
    mockGetAllDb.mockResolvedValueOnce([marker])
    const result = await getAllMoodMarkers()
    expect(result).toEqual([marker])
    expect(mockEnqueue).not.toHaveBeenCalled()
  })

  it('saveMoodMarker : écrit SQLite puis enqueue mood_marker (upsert)', async () => {
    await saveMoodMarker(marker)
    expect(mockSaveDb).toHaveBeenCalledWith(marker)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'm-1',
      module_id: 'mood_tracker',
      entry_kind: 'mood_marker',
      operation: 'upsert',
      payload: expect.objectContaining({ date: '2025-05-30', label: 'Début lithium' }),
    }))
  })

  it('saveMoodMarker : SQLite est appelé avant enqueue', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementationOnce(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementationOnce(() => { order.push('enqueue'); return Promise.resolve() })
    await saveMoodMarker(marker)
    expect(order[0]).toBe('db')
  })

  it('deleteMoodMarker : supprime SQLite puis enqueue mood_marker (delete)', async () => {
    await deleteMoodMarker('m-1')
    expect(mockDeleteDb).toHaveBeenCalledWith('m-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'm-1',
      module_id: 'mood_tracker',
      entry_kind: 'mood_marker',
      operation: 'delete',
    }))
  })

  it('saveMoodMarker : propage une erreur SQLite', async () => {
    mockSaveDb.mockRejectedValueOnce(new Error('db fail'))
    await expect(saveMoodMarker(marker)).rejects.toThrow('db fail')
    expect(mockEnqueue).not.toHaveBeenCalled()
  })
})
