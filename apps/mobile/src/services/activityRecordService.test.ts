const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveActivityRecord: (...a: unknown[]) => mockSaveDb(...a),
  deleteActivityRecord: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveActivityRecord, deleteActivityRecord } from './activityRecordService'

const record = {
  id: 'ar-1',
  date: '2025-01-01',
  label: 'Promenade',
  expected_pleasure: 4,
  expected_mastery: 3,
  pleasure: 7,
  mastery: 5,
  done: 1 as const,
  notes: null,
  planned_time: '17:30',
  domain_id: 'al.dom_body',
  config_activity_id: null,
}

beforeEach(() => jest.clearAllMocks())

describe('activityRecordService', () => {
  it('saveActivityRecord : écrit SQLite puis enqueue behavioral_activation', async () => {
    await saveActivityRecord(record)
    expect(mockSaveDb).toHaveBeenCalledWith(record)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'ar-1',
      module_id: 'behavioral_activation',
      entry_kind: 'activity_record',
      operation: 'upsert',
      payload: expect.objectContaining({
        label: 'Promenade',
        expected_pleasure: 4,
        expected_mastery: 3,
        pleasure: 7,
        mastery: 5,
        planned_time: '17:30',
        domain_id: 'al.dom_body',
        config_activity_id: null,
      }),
    }))
  })

  it('saveActivityRecord : les valeurs non renseignées (null) voyagent telles quelles', async () => {
    const planned = {
      ...record,
      done: 0 as const,
      expected_pleasure: null,
      expected_mastery: null,
      pleasure: null,
      mastery: null,
      planned_time: null,
    }
    await saveActivityRecord(planned)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({
        expected_pleasure: null,
        pleasure: null,
        planned_time: null,
      }),
    }))
  })

  it('deleteActivityRecord : supprime SQLite et enqueue delete', async () => {
    await deleteActivityRecord('ar-1')
    expect(mockDeleteDb).toHaveBeenCalledWith('ar-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'ar-1',
      module_id: 'behavioral_activation',
      operation: 'delete',
    }))
  })
})
