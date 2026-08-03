import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

import {
  fetchSafetyPlanItems,
  saveSafetyPlanItem,
  deleteSafetyPlanItem,
} from './safetyPlanItemsService'

/** Chaîne Supabase qui capture les arguments de chaque méthode appelée. */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const calls: Record<string, unknown[]> = {}
  const chain: unknown = new Proxy({}, {
    get(_target, prop: string) {
      if (prop === 'then') {
        return (r: (v: unknown) => unknown) =>
          Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(r)
      }
      return (...args: unknown[]) => { calls[prop] = args; return chain }
    },
  })
  return { chain, calls }
}

const ITEM = {
  id: 'i1', section_id: 'step_1', text: 'Je ne dors plus',
  kind: null, role: null, note: null, phone: null,
  sort_order: 0, authored_by: 'patient',
  created_at: '2026-06-11T10:00:00Z', updated_at: '2026-06-11T10:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('fetchSafetyPlanItems', () => {
  it('lit les items du patient, triés par étape puis par rang', async () => {
    const { chain, calls } = makeChain({ data: [ITEM] })
    mockFrom.mockReturnValue(chain)

    const items = await fetchSafetyPlanItems('pat-1')

    expect(mockFrom).toHaveBeenCalledWith('safety_plan_items')
    expect(calls.eq).toEqual(['patient_id', 'pat-1'])
    expect(calls.order).toEqual(['sort_order', { ascending: true }])
    expect(items).toHaveLength(1)
    expect(items[0].authored_by).toBe('patient')
  })

  // Un plan vide est un état normal : le patient n'a pas encore construit le sien.
  it('rend une liste vide quand le plan n\'existe pas encore', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null }).chain)
    await expect(fetchSafetyPlanItems('pat-1')).resolves.toEqual([])
  })

  it('propage l\'erreur de lecture au lieu de la masquer', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'RLS' } }).chain)
    await expect(fetchSafetyPlanItems('pat-1')).rejects.toBeTruthy()
  })
})

describe('saveSafetyPlanItem', () => {
  it('marque l\'item comme écrit par le praticien', async () => {
    const { chain, calls } = makeChain({})
    mockFrom.mockReturnValue(chain)

    await saveSafetyPlanItem('pat-1', { section_id: 'step_4', text: 'Le CMP', role: 'mon centre', phone: '0203040506' })

    expect(calls.upsert?.[0]).toMatchObject({
      patient_id: 'pat-1', section_id: 'step_4', text: 'Le CMP',
      role: 'mon centre', phone: '0203040506', authored_by: 'practitioner',
    })
  })

  // Un nouvel item laisse le serveur générer son identifiant.
  it('n\'envoie pas d\'identifiant à la création', async () => {
    const { chain, calls } = makeChain({})
    mockFrom.mockReturnValue(chain)
    await saveSafetyPlanItem('pat-1', { section_id: 'step_1', text: 'x' })
    expect(calls.upsert?.[0]).not.toHaveProperty('id')
  })

  it('réutilise l\'identifiant à la modification', async () => {
    const { chain, calls } = makeChain({})
    mockFrom.mockReturnValue(chain)
    await saveSafetyPlanItem('pat-1', { id: 'i1', section_id: 'step_1', text: 'corrigé' })
    expect(calls.upsert?.[0]).toMatchObject({ id: 'i1' })
  })

  it('propage l\'erreur d\'écriture', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'RLS' } }).chain)
    await expect(saveSafetyPlanItem('pat-1', { section_id: 'step_1', text: 'x' })).rejects.toBeTruthy()
  })
})

describe('deleteSafetyPlanItem', () => {
  it('supprime l\'item du patient visé, jamais un autre', async () => {
    const { chain, calls } = makeChain({})
    mockFrom.mockReturnValue(chain)
    await deleteSafetyPlanItem('pat-1', 'i1')
    // Les deux filtres comptent : l'identifiant seul suffirait à supprimer la ligne
    // d'un autre patient si la RLS venait à être élargie un jour.
    expect(calls.eq).toEqual(['patient_id', 'pat-1'])
  })

  it('propage l\'erreur de suppression', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'RLS' } }).chain)
    await expect(deleteSafetyPlanItem('pat-1', 'i1')).rejects.toBeTruthy()
  })
})
