const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
const mockSetSettingDb = jest.fn().mockResolvedValue(undefined)
const mockGetAllDb = jest.fn().mockResolvedValue([])
jest.mock('../lib/database', () => ({
  savePlanItem: (...a: unknown[]) => mockSaveDb(...a),
  deletePlanItem: (...a: unknown[]) => mockDeleteDb(...a),
  getAllPlanItemsForModule: (...a: unknown[]) => mockGetAllDb(...a),
  setModuleSetting: (...a: unknown[]) => mockSetSettingDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { readFileSync } from 'fs'
import { join } from 'path'
import { getPlanItems, savePlanItem, deletePlanItem, setModuleSetting } from './planItemService'

const item = {
  id: 'pi-1',
  module_id: 'crisis_plan',
  section_id: 'step_4',
  text: 'Appeler un ami',
  sort_order: 0,
  weight: null,
  phone: null,
  contact_source: null,
}

beforeEach(() => jest.clearAllMocks())

describe('planItemService', () => {
  describe('getPlanItems', () => {
    it('lit les items du module depuis SQLite (lecture seule, sans enqueue)', async () => {
      mockGetAllDb.mockResolvedValueOnce([item])
      const result = await getPlanItems('crisis_plan')
      expect(mockGetAllDb).toHaveBeenCalledWith('crisis_plan')
      expect(result).toEqual([item])
      expect(mockEnqueue).not.toHaveBeenCalled()
    })
  })

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

    it('propage numéro + provenance d\'un contact dans le payload synchronisé', async () => {
      await savePlanItem({ ...item, phone: '0102030405', contact_source: 'phonebook' })
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({ phone: '0102030405', contact_source: 'phonebook' }),
      }))
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

  // Garde-fou hors ligne (P-12) : la Séquence du plan de sécurité s'ouvre précisément
  // dans les moments où le réseau est le plus défaillant. La lecture du plan doit rester
  // strictement locale. Le test runtime ci-dessous ne verrait pas un appel réseau placé
  // derrière une branche non parcourue ; celui-ci relit le source et le voit.
  describe('lecture du plan : strictement locale', () => {
    it('lit SQLite, sans le moindre appel réseau', async () => {
      await getPlanItems('crisis_plan')
      expect(mockGetAllDb).toHaveBeenCalledWith('crisis_plan')
      expect(mockEnqueue).not.toHaveBeenCalled()
    })

    it('n\'importe aucun client réseau dans le service', () => {
      const source = readFileSync(join(__dirname, 'planItemService.ts'), 'utf-8')
      const imports = source.match(/^import[\s\S]*?from\s+'[^']+'/gm) ?? []
      expect(imports.join('\n')).not.toMatch(/lib\/supabase|@supabase|fetch\(/)
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
