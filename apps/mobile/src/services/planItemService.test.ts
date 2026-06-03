const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
const mockSetSettingDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  savePlanItem: (...a: unknown[]) => mockSaveDb(...a),
  deletePlanItem: (...a: unknown[]) => mockDeleteDb(...a),
  setModuleSetting: (...a: unknown[]) => mockSetSettingDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { savePlanItem, deletePlanItem, setModuleSetting } from './planItemService'

const item = {
  id: 'pi-1',
  module_id: 'crisis_plan',
  section_id: 'step_4',
  text: 'Appeler un ami',
  sort_order: 0,
  weight: null,
}

beforeEach(() => jest.clearAllMocks())

describe('planItemService', () => {
  describe('savePlanItem', () => {
    it('écrit SQLite puis enqueue upsert plan_item avec module_id', async () => {
      await savePlanItem(item)
      expect(mockSaveDb).toHaveBeenCalledWith(item)
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        local_id: 'pi-1',
        module_id: 'crisis_plan',
        entry_kind: 'plan_item',
        operation: 'upsert',
        payload: expect.objectContaining({ section_id: 'step_4', text: 'Appeler un ami' }),
      }))
    })

    it('SQLite est écrit avant le enqueue', async () => {
      const order: string[] = []
      mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
      mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
      await savePlanItem(item)
      expect(order[0]).toBe('db')
    })
  })

  describe('deletePlanItem', () => {
    it('supprime SQLite et enqueue delete avec moduleId optionnel', async () => {
      await deletePlanItem('pi-1', 'crisis_plan')
      expect(mockDeleteDb).toHaveBeenCalledWith('pi-1')
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        local_id: 'pi-1',
        module_id: 'crisis_plan',
        operation: 'delete',
      }))
    })

    it('fonctionne sans moduleId (param optionnel)', async () => {
      await deletePlanItem('pi-1')
      expect(mockDeleteDb).toHaveBeenCalledWith('pi-1')
      expect(mockEnqueue).toHaveBeenCalled()
    })
  })

  describe('setModuleSetting', () => {
    it('écrit SQLite puis enqueue module_setting avec local_id stable', async () => {
      await setModuleSetting('decisional_balance', 'target_behavior', 'Réduire le sucre')
      expect(mockSetSettingDb).toHaveBeenCalledWith('decisional_balance', 'target_behavior', 'Réduire le sucre')
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        local_id: 'decisional_balance:target_behavior',
        module_id: 'decisional_balance',
        entry_kind: 'module_setting',
        payload: { key: 'target_behavior', value: 'Réduire le sucre' },
      }))
    })
  })
})
