const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveFormEntry: (...a: unknown[]) => mockSaveDb(...a),
  deleteFormEntry: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveFormEntry, deleteFormEntry } from './formEntryService'

beforeEach(() => jest.clearAllMocks())

describe('formEntryService', () => {
  it('saveFormEntry : SQLite puis enqueue form_entry avec module_id', async () => {
    const entry = { id: 'fm-1', module_id: 'beck_columns', values: { situation: 'Réunion difficile' } }
    await saveFormEntry(entry)
    expect(mockSaveDb).toHaveBeenCalledWith(entry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fm-1',
      module_id: 'beck_columns',
      entry_kind: 'form_entry',
      operation: 'upsert',
    }))
  })

  it('saveFormEntry rétroactif : la date choisie est propagée en client_created_at', async () => {
    const entry = {
      id: 'fm-2',
      module_id: 'chronobiology_tracker',
      values: { wake_time: '07:30' },
      created_at: '2026-06-01T00:00:00.000Z',
    }
    await saveFormEntry(entry)
    expect(mockSaveDb).toHaveBeenCalledWith(entry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fm-2',
      operation: 'upsert',
      client_created_at: '2026-06-01T00:00:00.000Z',
    }))
  })

  it('saveFormEntry sans created_at : client_created_at horodaté à l’instant', async () => {
    const before = Date.now()
    await saveFormEntry({ id: 'fm-3', module_id: 'beck_columns', values: {} })
    const arg = mockEnqueue.mock.calls[0][0] as { client_created_at: string }
    expect(typeof arg.client_created_at).toBe('string')
    expect(new Date(arg.client_created_at).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('deleteFormEntry sans moduleId : module_id vide par défaut', async () => {
    await deleteFormEntry('fm-1')
    expect(mockDeleteDb).toHaveBeenCalledWith('fm-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fm-1',
      module_id: '',
      operation: 'delete',
    }))
  })
})
