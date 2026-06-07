const mockSaveFearEntry = jest.fn().mockResolvedValue(undefined)
const mockDeleteFearEntry = jest.fn().mockResolvedValue(undefined)
const mockSaveFearSituation = jest.fn().mockResolvedValue(undefined)
const mockDeleteFearSituation = jest.fn().mockResolvedValue(undefined)
const mockCreateHierarchy = jest.fn().mockResolvedValue(undefined)
const mockDeleteHierarchy = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveFearEntry: (...a: unknown[]) => mockSaveFearEntry(...a),
  deleteFearEntry: (...a: unknown[]) => mockDeleteFearEntry(...a),
  saveFearSituation: (...a: unknown[]) => mockSaveFearSituation(...a),
  deleteFearSituation: (...a: unknown[]) => mockDeleteFearSituation(...a),
  createExposureHierarchy: (...a: unknown[]) => mockCreateHierarchy(...a),
  deleteExposureHierarchy: (...a: unknown[]) => mockDeleteHierarchy(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import {
  saveFearEntry, deleteFearEntry,
  saveFearSituation, deleteFearSituation,
  createExposureHierarchy, deleteExposureHierarchy,
} from './fearTrackerService'

beforeEach(() => jest.clearAllMocks())

const fearEntry = {
  id: 'fe-1',
  date: '2025-01-01T10:00:00.000Z',
  situation_id: null,
  situation_label: 'Ascenseur',
  suds_before: 70,
  suds_peak: 85,
  strategies: '{"selected":[]}',
  custom_strategy: null,
  suds_after: 40,
  expectation_text: null,
  outcome_text: null,
  notes: null,
}

const situation = {
  id: 'fs-1',
  label: 'Foule',
  hierarchy_id: null,
  target_suds: 60,
  is_done: 0,
}

const hierarchy = {
  id: 'eh-1',
  module_id: 'exposure_hierarchy',
  title: 'Phobies sociales',
}

describe('fearTrackerService', () => {
  it('saveFearEntry : SQLite puis enqueue fear_entry', async () => {
    await saveFearEntry(fearEntry)
    expect(mockSaveFearEntry).toHaveBeenCalledWith(fearEntry)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fe-1',
      module_id: 'fear_thermometer',
      entry_kind: 'fear_entry',
      operation: 'upsert',
    }))
  })

  it('deleteFearEntry : SQLite puis enqueue delete', async () => {
    await deleteFearEntry('fe-1')
    expect(mockDeleteFearEntry).toHaveBeenCalledWith('fe-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fe-1',
      operation: 'delete',
      entry_kind: 'fear_entry',
    }))
  })

  it('saveFearSituation : SQLite puis enqueue fear_situation', async () => {
    await saveFearSituation(situation)
    expect(mockSaveFearSituation).toHaveBeenCalledWith(situation)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fs-1',
      entry_kind: 'fear_situation',
      operation: 'upsert',
    }))
  })

  it('deleteFearSituation : SQLite puis enqueue delete', async () => {
    await deleteFearSituation('fs-1')
    expect(mockDeleteFearSituation).toHaveBeenCalledWith('fs-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'fs-1',
      operation: 'delete',
    }))
  })

  it('createExposureHierarchy : SQLite puis enqueue exposure_hierarchy', async () => {
    await createExposureHierarchy(hierarchy)
    expect(mockCreateHierarchy).toHaveBeenCalledWith(hierarchy)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'eh-1',
      entry_kind: 'exposure_hierarchy',
      operation: 'upsert',
    }))
  })

  it('deleteExposureHierarchy : SQLite puis enqueue delete', async () => {
    await deleteExposureHierarchy('eh-1')
    expect(mockDeleteHierarchy).toHaveBeenCalledWith('eh-1')
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'eh-1',
      operation: 'delete',
    }))
  })
})
