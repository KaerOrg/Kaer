const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockGetAllDb = jest.fn().mockResolvedValue([])
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveCustomChip: (...a: unknown[]) => mockSaveDb(...a),
  getCustomChips: (...a: unknown[]) => mockGetAllDb(...a),
  deleteCustomChip: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveCustomChip, removeCustomChip, fetchCustomChips } from './customChipService'

beforeEach(() => jest.clearAllMocks())

const chip = { id: 'c1', module_id: 'craving_journal', group_key: 'emotion', label: 'apéro' }

describe('customChipService — saveCustomChip', () => {
  it('écrit SQLite puis enqueue custom_chip', async () => {
    await saveCustomChip(chip)
    expect(mockSaveDb).toHaveBeenCalledWith(chip)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'c1',
      module_id: 'craving_journal',
      entry_kind: 'custom_chip',
      operation: 'upsert',
      payload: expect.objectContaining({ group_key: 'emotion', label: 'apéro' }),
    }))
  })

  it('SQLite avant enqueue', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
    await saveCustomChip(chip)
    expect(order[0]).toBe('db')
  })
})

describe('customChipService — removeCustomChip', () => {
  it('supprime SQLite puis enqueue un delete', async () => {
    await removeCustomChip('c1', 'craving_journal')
    expect(mockDeleteDb).toHaveBeenCalledWith('c1')
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ local_id: 'c1', operation: 'delete', entry_kind: 'custom_chip' }),
    )
  })
})

describe('customChipService — fetchCustomChips', () => {
  it('délègue au DB, avec et sans groupe', async () => {
    mockGetAllDb.mockResolvedValueOnce([chip])
    expect(await fetchCustomChips('craving_journal', 'emotion')).toEqual([chip])
    expect(mockGetAllDb).toHaveBeenCalledWith('craving_journal', 'emotion')
    await fetchCustomChips('craving_journal')
    expect(mockGetAllDb).toHaveBeenLastCalledWith('craving_journal', undefined)
  })
})
