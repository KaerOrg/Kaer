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
