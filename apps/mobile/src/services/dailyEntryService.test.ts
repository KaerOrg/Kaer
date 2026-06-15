const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveDailyEntry: (...a: unknown[]) => mockSaveDb(...a),
  deleteDailyEntry: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveDailyEntry, deleteDailyEntry } from './dailyEntryService'

beforeEach(() => jest.clearAllMocks())

describe('dailyEntryService', () => {
  it('saveDailyEntry : SQLite puis enqueue daily_entry', async () => {
    const entry = { id: 'de-1', module_id: 'medication_adherence', date: '2025-01-01', status: 'taken', reason: null, notes: null }
    await saveDailyEntry(entry)
    expect(mockSaveDb).toHaveBeenCalledWith(entry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'de-1',
      module_id: 'medication_adherence',
      entry_kind: 'daily_entry',
      operation: 'upsert',
    }))
  })

  it('deleteDailyEntry avec moduleId : propagé dans l\'enqueue', async () => {
    await deleteDailyEntry('de-1', 'medication_adherence')
    expect(mockDeleteDb).toHaveBeenCalledWith('de-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'de-1',
      module_id: 'medication_adherence',
      operation: 'delete',
    }))
  })
})
