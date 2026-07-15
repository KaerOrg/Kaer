const mockGetDb = jest.fn().mockResolvedValue([])
const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  getAllTimelineMarkers: (...a: unknown[]) => mockGetDb(...a),
  saveTimelineMarker: (...a: unknown[]) => mockSaveDb(...a),
  deleteTimelineMarker: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { getAllTimelineMarkers, saveTimelineMarker, deleteTimelineMarker } from './timelineMarkerService'
import type { TimelineMarker } from '../lib/database'

const marker: TimelineMarker = {
  id: 'm-1',
  scale_id: 'mood_tracker',
  date: '2026-06-14',
  label: 'Passage à 150 mg',
  type: 'treatment',
  created_at: '2026-06-14T10:00:00.000Z',
}

beforeEach(() => jest.clearAllMocks())

describe('timelineMarkerService', () => {
  it('getAllTimelineMarkers lit par module (sans sync)', async () => {
    await getAllTimelineMarkers('mood_tracker')
    expect(mockGetDb).toHaveBeenCalledWith('mood_tracker')
    expect(mockEnqueue).not.toHaveBeenCalled()
  })

  it('saveTimelineMarker écrit en SQLite puis enqueue un upsert typé', async () => {
    await saveTimelineMarker(marker)
    expect(mockSaveDb).toHaveBeenCalledWith(marker)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'm-1',
      module_id: 'mood_tracker',
      entry_kind: 'mood_marker',
      operation: 'upsert',
      payload: expect.objectContaining({ type: 'treatment', label: 'Passage à 150 mg', scale_id: 'mood_tracker' }),
    }))
  })

  it('écrit en SQLite AVANT le enqueue (SQLite-first)', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
    await saveTimelineMarker(marker)
    expect(order[0]).toBe('db')
  })

  it('deleteTimelineMarker supprime en SQLite et enqueue un delete', async () => {
    await deleteTimelineMarker('m-1', 'mood_tracker')
    expect(mockDeleteDb).toHaveBeenCalledWith('m-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'm-1',
      module_id: 'mood_tracker',
      entry_kind: 'mood_marker',
      operation: 'delete',
    }))
  })
})
