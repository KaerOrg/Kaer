const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveSleepEntry: (...a: unknown[]) => mockSaveDb(...a),
  deleteSleepEntry: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveSleepEntry, deleteSleepEntry } from './sleepDiaryService'

const entry = {
  id: 'sl-1',
  date: '2025-01-01',
  in_bed_time: '22:45',
  bedtime: '23:00',
  wake_time: '07:00',
  out_of_bed_time: '07:15',
  sleep_onset_minutes: 15,
  awakenings: 1,
  awakenings_duration_minutes: 10,
  quality: 4,
  restedness: 3,
  nap_minutes: 0,
  sleep_aid: 0,
  nightmares: 0,
  notes: null,
}

beforeEach(() => jest.clearAllMocks())

describe('sleepDiaryService', () => {
  it('saveSleepEntry : écrit SQLite puis enqueue upsert sleep_diary', async () => {
    await saveSleepEntry(entry)
    expect(mockSaveDb).toHaveBeenCalledWith(entry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'sl-1',
      module_id: 'sleep_diary',
      entry_kind: 'sleep_diary_entry',
      operation: 'upsert',
      payload: expect.objectContaining({ date: '2025-01-01', quality: 4 }),
    }))
  })

  it('deleteSleepEntry : supprime SQLite et enqueue delete', async () => {
    await deleteSleepEntry('sl-1')
    expect(mockDeleteDb).toHaveBeenCalledWith('sl-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'sl-1',
      module_id: 'sleep_diary',
      operation: 'delete',
    }))
  })

  it('saveSleepEntry : SQLite appelé avant enqueue', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
    await saveSleepEntry(entry)
    expect(order[0]).toBe('db')
  })
})
