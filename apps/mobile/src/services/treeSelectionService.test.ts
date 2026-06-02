const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveTreeSelection: (...a: unknown[]) => mockSaveDb(...a),
  deleteTreeSelection: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveTreeSelection, deleteTreeSelection } from './treeSelectionService'

beforeEach(() => jest.clearAllMocks())

describe('treeSelectionService', () => {
  it('saveTreeSelection : SQLite puis enqueue tree_selection', async () => {
    const entry = {
      id: 'ts-1',
      module_id: 'emotion_wheel',
      selected_id: 'joy_happy',
      selected_label: 'Heureux',
      path: [{ id: 'joy', text_code: 'modules.emotion_wheel.joy' }],
      intensity: 8,
      notes: null,
    }
    await saveTreeSelection(entry)
    expect(mockSaveDb).toHaveBeenCalledWith(entry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'ts-1',
      module_id: 'emotion_wheel',
      entry_kind: 'tree_selection',
      operation: 'upsert',
    }))
  })

  it('deleteTreeSelection : SQLite puis enqueue delete', async () => {
    await deleteTreeSelection('ts-1', 'emotion_wheel')
    expect(mockDeleteDb).toHaveBeenCalledWith('ts-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'ts-1',
      operation: 'delete',
    }))
  })
})
