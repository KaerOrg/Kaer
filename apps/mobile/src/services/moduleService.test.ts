const mockFrom = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import { fetchPatientModuleConfig, isModuleUnlocked } from './moduleService'

// Note : fetchModuleFields est testé dans @kaer/shared (packages/shared/src/services/moduleFields.test.ts)
// car la logique est partagée entre web et mobile via le service injecté.

interface ChainOpts {
  data?: unknown
  error?: unknown
}

function makeChain({ data = null, error = null }: ChainOpts = {}) {
  const result = { data, error }
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      }
      if (!target[prop]) target[prop] = jest.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

describe('moduleService.fetchPatientModuleConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it("renvoie le champ config si la ligne existe", async () => {
    const chain = makeChain({ data: { config: { alternative_scenario: 'allo' } } })
    mockFrom.mockReturnValueOnce(chain)

    const result = await fetchPatientModuleConfig('pat-1', 'rim')

    expect(result).toEqual({ alternative_scenario: 'allo' })
  })

  it('renvoie null si aucune ligne', async () => {
    const chain = makeChain({ data: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await fetchPatientModuleConfig('pat-1', 'rim')

    expect(result).toBeNull()
  })
})

describe('moduleService.isModuleUnlocked', () => {
  beforeEach(() => jest.clearAllMocks())

  it('confirme le déverrouillage quand la ligne existe', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: { id: 'pm-1' } }))
    await expect(isModuleUnlocked('pat-1', 'distress_tolerance')).resolves.toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('patient_modules')
  })

  it('renvoie false quand le module n\'est pas déverrouillé', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null }))
    await expect(isModuleUnlocked('pat-1', 'distress_tolerance')).resolves.toBe(false)
  })

  // Hors ligne, mieux vaut ne pas proposer une porte que d'en proposer une qui ne
  // s'ouvrirait pas : l'échec de lecture fait disparaître le lien, il ne le grise pas.
  it('renvoie false quand la lecture échoue', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: { message: 'offline' } }))
    await expect(isModuleUnlocked('pat-1', 'distress_tolerance')).resolves.toBe(false)
  })
})
