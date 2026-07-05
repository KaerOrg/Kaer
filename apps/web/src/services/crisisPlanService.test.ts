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
  it('retourne la config si présente', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'Bravo', commitment_phrase: "Je m'engage" } }))
      .mockReturnValueOnce(makeChain({ data: [{ id: 'uuid-1', thought: 'X', response: 'Y', sort_order: 0 }] }))
    const cfg = await fetchCrisisPlanConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('Bravo')
    expect(cfg.copingCards).toHaveLength(1)
    expect(cfg.copingCards[0].thought).toBe('X')
    expect(cfg.commitmentPhrase).toBe("Je m'engage")
  })

  it('retourne des valeurs par défaut si aucune config', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null }))
      .mockReturnValueOnce(makeChain({ data: [] }))
    const cfg = await fetchCrisisPlanConfig('patient-2')
    expect(cfg.practitionerMessage).toBe('')
    expect(cfg.copingCards).toEqual([])
    expect(cfg.commitmentPhrase).toBe('')
  })

  it('requête à chaque appel — la déduplication est déléguée à React Query', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'A', commitment_phrase: '' } }))
      .mockReturnValueOnce(makeChain({ data: [] }))
      .mockReturnValueOnce(makeChain({ data: { practitioner_message: 'A', commitment_phrase: '' } }))
      .mockReturnValueOnce(makeChain({ data: [] }))
    await fetchCrisisPlanConfig('patient-3')
    await fetchCrisisPlanConfig('patient-3')
    // 2 requêtes Supabase par appel (config + cards) × 2 appels = 4 (aucun cache service).
    expect(mockFrom).toHaveBeenCalledTimes(4)
  })
})

describe('saveCrisisPlanConfig', () => {
  it('retourne ok:true si succès', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: 'Test',
      copingCards: [],
      commitmentPhrase: '',
    })
    expect(result.ok).toBe(true)
  })

  it('retourne ok:false si erreur sur upsert config', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'Permission denied' } }))
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: '',
      copingCards: [],
      commitmentPhrase: '',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Permission denied')
  })

  it('insère les cartes de coping si présentes', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))   // upsert config
      .mockReturnValueOnce(makeChain({ data: null, error: null }))   // delete cards
      .mockReturnValueOnce(makeChain({ data: null, error: null }))   // insert cards
    const result = await saveCrisisPlanConfig('patient-1', {
      practitionerMessage: '',
      copingCards: [{ id: '1', thought: 'A', response: 'B' }],
      commitmentPhrase: '',
    })
    expect(result.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledTimes(3)
  })
})
