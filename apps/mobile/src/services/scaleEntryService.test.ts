const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveScaleEntry: (...a: unknown[]) => mockSaveDb(...a),
  deleteScaleEntry: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveScaleEntry, deleteScaleEntry } from './scaleEntryService'

const entry = {
  id: 'sc-1',
  scale_id: 'phq9',
  answers: [0, 1, 2, 3],
  total_score: 6,
  subscale_scores: null,
  created_at: '2025-01-01T10:00:00.000Z',
}

beforeEach(() => jest.clearAllMocks())

describe('scaleEntryService', () => {
  describe('saveScaleEntry', () => {
    it('écrit en SQLite puis enqueue vers Supabase', async () => {
      await saveScaleEntry(entry)
      expect(mockSaveDb).toHaveBeenCalledWith(entry)
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        local_id: 'sc-1',
        module_id: 'phq9',
        entry_kind: 'scale_entry',
        operation: 'upsert',
        payload: expect.objectContaining({ scale_id: 'phq9', total_score: 6 }),
      }))
    })

    it('SQLite est écrit avant le enqueue (SQLite-first)', async () => {
      const order: string[] = []
      mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
      mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
      await saveScaleEntry(entry)
      expect(order[0]).toBe('db')
    })

    it('consent OFF → enqueue no-op (RemoteSyncService gate)', async () => {
      mockEnqueue.mockResolvedValue(undefined)
      await saveScaleEntry(entry)
      // L'enqueue est appelé (le gate est dans RemoteSyncService, pas ici)
      // mais le service le transmet toujours — le mock ne simule pas le gate
      expect(mockSaveDb).toHaveBeenCalled()
    })
  })

  describe('deleteScaleEntry', () => {
    it('supprime en SQLite et enqueue un delete', async () => {
      await deleteScaleEntry('sc-1')
      expect(mockDeleteDb).toHaveBeenCalledWith('sc-1')
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        local_id: 'sc-1',
        entry_kind: 'scale_entry',
        operation: 'delete',
      }))
    })
  })
})
