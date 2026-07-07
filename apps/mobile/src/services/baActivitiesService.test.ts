const mockFrom = jest.fn()
jest.mock('../lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => mockFrom(...a) },
}))

import { fetchBAActivities } from './baActivitiesService'

const ACTIVITY = { id: 'a1', label: 'Marche 20 min', domain_id: 'al.dom_body', value_text: null }

function makeChain(result: { data: unknown }) {
  const chain: Record<string, jest.Mock> = {}
  for (const m of ['select', 'eq']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.maybeSingle = jest.fn().mockResolvedValue(result)
  return chain
}

beforeEach(() => jest.clearAllMocks())

describe('baActivitiesService.fetchBAActivities', () => {
  it('retourne la liste depuis patient_modules.config.ba_activities', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { config: { ba_activities: [ACTIVITY] } } }))
    expect(await fetchBAActivities('pat-1')).toEqual([ACTIVITY])
    expect(mockFrom).toHaveBeenCalledWith('patient_modules')
  })

  it('retourne [] si config absente ou clé non-tableau', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null }))
    expect(await fetchBAActivities('pat-1')).toEqual([])

    mockFrom.mockReturnValue(makeChain({ data: { config: { ba_activities: 'oops' } } }))
    expect(await fetchBAActivities('pat-1')).toEqual([])
  })
})
