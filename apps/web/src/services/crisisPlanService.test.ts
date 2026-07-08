import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

import {
  fetchCrisisPlanConfig,
  saveCrisisPlanConfig,
} from './crisisPlanService'

function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (r: (v: unknown) => unknown) => Promise.resolve(result).then(r)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCrisisPlanConfig', () => {
  it('retourne le message praticien si présent', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: { practitioner_message: 'Bravo' } }))
    const cfg = await fetchCrisisPlanConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('Bravo')
  })

  it('retourne une valeur par défaut si aucune config', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null }))
    const cfg = await fetchCrisisPlanConfig('patient-2')
    expect(cfg.practitionerMessage).toBe('')
  })

  it('requête à chaque appel — la déduplication est déléguée à React Query', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'A' } }))
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'A' } }))
    await fetchCrisisPlanConfig('patient-3')
    await fetchCrisisPlanConfig('patient-3')
    // 1 requête Supabase par appel (config) × 2 appels = 2 (aucun cache service).
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })
})

describe('saveCrisisPlanConfig', () => {
  it('retourne ok:true si succès', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }))
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: 'Test',
    })
    expect(result.ok).toBe(true)
  })

  it('retourne ok:false si erreur sur upsert config', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'Permission denied' } }))
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: '',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Permission denied')
  })
})
