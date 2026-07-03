import { describe, it, expect } from 'vitest'

vi.mock('@services/crisisPlanService', () => ({ fetchCrisisPlanConfig: vi.fn() }))

import { crisisQueries } from './crisisQueries'

describe('crisisQueries.planConfig', () => {
  it('produit une clé canonique par patient', () => {
    expect(crisisQueries.planConfig('p1').queryKey).toEqual(['crisis', 'planConfig', 'p1'])
  })

  it('désactive la query sans patient (undefined ou vide)', () => {
    expect(crisisQueries.planConfig(undefined).enabled).toBe(false)
    expect(crisisQueries.planConfig('').enabled).toBe(false)
    expect(crisisQueries.planConfig(null).enabled).toBe(false)
    expect(crisisQueries.planConfig('p1').enabled).toBe(true)
  })

  it('n\'est pas en cache infini (donnée patient volatile)', () => {
    expect(crisisQueries.planConfig('p1').staleTime).not.toBe(Infinity)
    expect(crisisQueries.planConfig('p1').meta).toBeUndefined()
  })
})
