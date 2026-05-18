import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

import { fetchCrisisPlanConfig, saveCrisisPlanConfig } from './crisisPlanService'

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

beforeEach(() => vi.clearAllMocks())

describe('fetchCrisisPlanConfig', () => {
  it('retourne la config si présente', async () => {
    mockFrom.mockReturnValueOnce(makeChain({
      data: { config: { crisisPlan: { practitionerMessage: 'Bravo', copingCards: [{ id: '1', thought: 'X', response: 'Y' }], commitmentPhrase: "Je m'engage" } } },
    }))
    const cfg = await fetchCrisisPlanConfig('mod-1')
    expect(cfg.practitionerMessage).toBe('Bravo')
    expect(cfg.copingCards).toHaveLength(1)
    expect(cfg.commitmentPhrase).toBe("Je m'engage")
  })

  it('retourne des valeurs par défaut si config absente', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null }))
    const cfg = await fetchCrisisPlanConfig('mod-1')
    expect(cfg.practitionerMessage).toBe('')
    expect(cfg.copingCards).toEqual([])
    expect(cfg.commitmentPhrase).toBe('')
  })
})

describe('saveCrisisPlanConfig', () => {
  it('retourne ok:true si succès', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }))
    const result = await saveCrisisPlanConfig('mod-1', {
      practitionerMessage: 'Test',
      copingCards: [],
      commitmentPhrase: '',
    })
    expect(result.ok).toBe(true)
  })

  it('retourne ok:false avec message si erreur Supabase', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ error: { message: 'Permission denied' } }))
    const result = await saveCrisisPlanConfig('mod-1', {
      practitionerMessage: '',
      copingCards: [],
      commitmentPhrase: '',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Permission denied')
  })
})
