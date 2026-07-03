import { describe, it, expect } from 'vitest'

vi.mock('@services/caseloadService', () => ({ fetchCaseload: vi.fn() }))
vi.mock('@services/notificationRoutineService', () => ({ getActivityFeed: vi.fn() }))

import { caseloadQueries } from './caseloadQueries'
import { activityFeedQueries } from './activityFeedQueries'

describe('caseloadQueries.rows', () => {
  it('produit une clé canonique par praticien', () => {
    expect(caseloadQueries.rows('pr1').queryKey).toEqual(['caseload', 'rows', 'pr1'])
  })
  it('désactive la query sans praticien', () => {
    expect(caseloadQueries.rows(undefined).enabled).toBe(false)
    expect(caseloadQueries.rows('pr1').enabled).toBe(true)
  })
  it('n\'est pas en cache infini (donnée volatile)', () => {
    expect(caseloadQueries.rows('pr1').staleTime).not.toBe(Infinity)
  })
})

describe('activityFeedQueries.feed', () => {
  it('produit une clé canonique par praticien', () => {
    expect(activityFeedQueries.feed('pr1').queryKey).toEqual(['activityFeed', 'pr1'])
  })
  it('désactive la query sans praticien', () => {
    expect(activityFeedQueries.feed(undefined).enabled).toBe(false)
    expect(activityFeedQueries.feed('pr1').enabled).toBe(true)
  })
})
