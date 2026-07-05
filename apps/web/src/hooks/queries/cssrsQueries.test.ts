import { describe, it, expect } from 'vitest'

vi.mock('@services/cssrsService', () => ({ fetchCSSRSAssessments: vi.fn() }))

import { cssrsQueries } from './cssrsQueries'

describe('cssrsQueries.assessments', () => {
  it('produit une clé canonique par (patient, praticien)', () => {
    expect(cssrsQueries.assessments('pt1', 'pr1').queryKey).toEqual([
      'cssrs', 'assessments', 'pt1', 'pr1',
    ])
  })

  it('désactive la query si patient ou praticien manque', () => {
    expect(cssrsQueries.assessments(undefined, 'pr1').enabled).toBe(false)
    expect(cssrsQueries.assessments('pt1', undefined).enabled).toBe(false)
    expect(cssrsQueries.assessments('pt1', 'pr1').enabled).toBe(true)
  })

  it('n\'est pas en cache infini (donnée volatile)', () => {
    expect(cssrsQueries.assessments('pt1', 'pr1').staleTime).not.toBe(Infinity)
  })
})
