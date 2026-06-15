const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
const mockGetIntakes = jest.fn().mockResolvedValue([])
jest.mock('../lib/database', () => ({
  saveMedicationIntake: (...a: unknown[]) => mockSaveDb(...a),
  deleteMedicationIntake: (...a: unknown[]) => mockDeleteDb(...a),
  getMedicationIntakes: (...a: unknown[]) => mockGetIntakes(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { saveMedicationIntake, deleteMedicationIntake } from './medicationIntakeService'

beforeEach(() => jest.clearAllMocks())

describe('medicationIntakeService', () => {
  it('saveMedicationIntake : SQLite puis enqueue medication_intake (upsert)', async () => {
    const entry = {
      id: 'mi-1',
      module_id: 'medication_adherence',
      date: '2025-01-01',
      medication_id: 'med-a',
      status: 'taken',
      reason: null,
    }
    await saveMedicationIntake(entry)
    expect(mockSaveDb).toHaveBeenCalledWith(entry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'mi-1',
      module_id: 'medication_adherence',
      entry_kind: 'medication_intake',
      operation: 'upsert',
    }))
  })

  it('saveMedicationIntake : le motif de non-prise est répliqué dans le payload', async () => {
    await saveMedicationIntake({
      id: 'mi-2',
      module_id: 'medication_adherence',
      date: '2025-01-02',
      medication_id: 'med-b',
      status: 'missed',
      reason: 'side_effect',
    })
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ medication_id: 'med-b', status: 'missed', reason: 'side_effect' }),
    }))
  })

  it('deleteMedicationIntake : SQLite puis enqueue delete', async () => {
    await deleteMedicationIntake('mi-1', 'medication_adherence')
    expect(mockDeleteDb).toHaveBeenCalledWith('mi-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'mi-1',
      module_id: 'medication_adherence',
      operation: 'delete',
    }))
  })
})
