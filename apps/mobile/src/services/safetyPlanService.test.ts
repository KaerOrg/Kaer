const mockFrom = jest.fn()
jest.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
const mockGetAllDb = jest.fn().mockResolvedValue([])
jest.mock('../lib/database', () => ({
  savePlanItem: (...a: unknown[]) => mockSaveDb(...a),
  deletePlanItem: (...a: unknown[]) => mockDeleteDb(...a),
  getAllPlanItemsForModule: (...a: unknown[]) => mockGetAllDb(...a),
}))

// Sentinelle : ce service écrit dans le document partagé, il ne passe JAMAIS par
// l'outbox montante. Si un `enqueue` apparaissait, ce mock le verrait.
const mockEnqueue = jest.fn()
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

import { readFileSync } from 'fs'
import { join } from 'path'
import { refreshSafetyPlan, saveSafetyPlanItem, deleteSafetyPlanItem } from './safetyPlanService'

/** Chaîne Supabase : chaque méthode renvoie la chaîne, l'attente rend `result`. */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const calls: Record<string, unknown[]> = {}
  const proxy: unknown = new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(resolve)
      }
      return (...args: unknown[]) => {
        calls[prop] = args
        return proxy
      }
    },
  })
  return { proxy, calls }
}

function row(over: Partial<{ id: string; section_id: string; text: string; sort_order: number; phone: string | null }> = {}) {
  return {
    id: over.id ?? 'r1',
    section_id: over.section_id ?? 'step_1',
    text: over.text ?? 'Je ne dors plus',
    kind: null,
    role: null,
    note: null,
    phone: over.phone ?? null,
    sort_order: over.sort_order ?? 0,
    authored_by: 'patient',
    created_at: '2026-01-01T00:00:00Z',
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetAllDb.mockResolvedValue([])
})

describe('refreshSafetyPlan', () => {
  it('recopie les items du serveur dans le cache local', async () => {
    const { proxy, calls } = makeChain({ data: [row({ id: 'r1' }), row({ id: 'r2', section_id: 'step_2' })] })
    mockFrom.mockReturnValue(proxy)

    await expect(refreshSafetyPlan('pat-1')).resolves.toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('safety_plan_items')
    expect(calls.eq).toEqual(['patient_id', 'pat-1'])
    expect(mockSaveDb).toHaveBeenCalledTimes(2)
    expect(mockSaveDb).toHaveBeenCalledWith(expect.objectContaining({
      id: 'r1', module_id: 'crisis_plan', section_id: 'step_1',
    }))
  })

  // Sans ça, le plan ne ferait que grossir : un item supprimé ailleurs resterait.
  it('retire du cache les items disparus du serveur', async () => {
    mockGetAllDb.mockResolvedValue([
      { id: 'r1', module_id: 'crisis_plan', section_id: 'step_1', text: 'garde', sort_order: 0, weight: null, phone: null, contact_source: null, created_at: '' },
      { id: 'obsolete', module_id: 'crisis_plan', section_id: 'step_1', text: 'supprime ailleurs', sort_order: 1, weight: null, phone: null, contact_source: null, created_at: '' },
    ])
    mockFrom.mockReturnValue(makeChain({ data: [row({ id: 'r1' })] }).proxy)

    await refreshSafetyPlan('pat-1')
    expect(mockDeleteDb).toHaveBeenCalledWith('obsolete')
    expect(mockDeleteDb).not.toHaveBeenCalledWith('r1')
  })

  // Perdre le réseau ne doit JAMAIS vider un plan de sécurité : c'est le cas d'usage
  // où ce serait le plus grave.
  it('laisse le cache intact quand la lecture échoue', async () => {
    mockGetAllDb.mockResolvedValue([
      { id: 'r1', module_id: 'crisis_plan', section_id: 'step_1', text: 'garde', sort_order: 0, weight: null, phone: null, contact_source: null, created_at: '' },
    ])
    mockFrom.mockReturnValue(makeChain({ error: { message: 'offline' } }).proxy)

    await expect(refreshSafetyPlan('pat-1')).resolves.toBe(false)
    expect(mockDeleteDb).not.toHaveBeenCalled()
    expect(mockSaveDb).not.toHaveBeenCalled()
  })
})

describe('saveSafetyPlanItem', () => {
  it('écrit le serveur puis le cache local', async () => {
    const { proxy, calls } = makeChain({})
    mockFrom.mockReturnValue(proxy)

    await expect(saveSafetyPlanItem('pat-1', {
      id: 'i1', section_id: 'step_4', text: 'Marie', sort_order: 0, phone: '0102030405',
    })).resolves.toBe(true)

    expect(calls.upsert?.[0]).toMatchObject({
      id: 'i1', patient_id: 'pat-1', section_id: 'step_4', text: 'Marie',
      phone: '0102030405', authored_by: 'patient',
    })
    expect(mockSaveDb).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1', module_id: 'crisis_plan' }))
  })

  // Mieux vaut que le patient voie que sa saisie n'a pas été prise que de lui montrer
  // un item qui n'existe que sur son téléphone et disparaîtra au rafraîchissement.
  it('n\'écrit rien localement si le serveur refuse', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'RLS' } }).proxy)
    await expect(saveSafetyPlanItem('pat-1', {
      id: 'i1', section_id: 'step_4', text: 'Marie', sort_order: 0,
    })).resolves.toBe(false)
    expect(mockSaveDb).not.toHaveBeenCalled()
  })
})

describe('deleteSafetyPlanItem', () => {
  it('supprime le serveur puis le cache local', async () => {
    mockFrom.mockReturnValue(makeChain({}).proxy)
    await expect(deleteSafetyPlanItem('pat-1', 'i1')).resolves.toBe(true)
    expect(mockDeleteDb).toHaveBeenCalledWith('i1')
  })

  it('ne supprime rien localement si le serveur refuse', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'RLS' } }).proxy)
    await expect(deleteSafetyPlanItem('pat-1', 'i1')).resolves.toBe(false)
    expect(mockDeleteDb).not.toHaveBeenCalled()
  })
})

describe('invariants du service', () => {
  // Le plan a quitté l'outbox montante : c'est tout l'objet de PW-1.
  it('ne passe jamais par l\'outbox de synchronisation', async () => {
    mockFrom.mockReturnValue(makeChain({}).proxy)
    await saveSafetyPlanItem('pat-1', { id: 'i1', section_id: 'step_1', text: 'x', sort_order: 0 })
    await deleteSafetyPlanItem('pat-1', 'i1')
    expect(mockEnqueue).not.toHaveBeenCalled()
  })

  // Garde-fou statique : la Balance décisionnelle continue de passer par
  // `planItemService`. Si ce service se mettait à écrire pour tous les modules, ses
  // items atterriraient dans le plan de sécurité d'un patient.
  it('ne sert que le module du plan de sécurité', () => {
    const source = readFileSync(join(__dirname, 'safetyPlanService.ts'), 'utf-8')
    // Le module est une CONSTANTE, jamais un paramètre : impossible de router les
    // items d'un autre module vers cette table par une erreur d'appel.
    expect(source).toMatch(/SAFETY_PLAN_MODULE_ID = 'crisis_plan'/)
    expect(source).not.toMatch(/moduleId\s*[,:)]/)
  })
})
