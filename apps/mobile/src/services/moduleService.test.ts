const mockFrom = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import { fetchPatientModuleConfig } from './moduleService'

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
