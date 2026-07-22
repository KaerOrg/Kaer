import { describe, it, expect } from 'vitest'
import type { DefusionPoint } from '@services/engagementService'
import { filterSessions, computeSynthesis, groupByMonth, hasMeasures } from './defusionData'

function pt(over: Partial<DefusionPoint>): DefusionPoint {
  return {
    date: '2026-07-10T10:00:00Z',
    technique: 'word_repetition',
    discomfort_before: 8, discomfort_after: 5,
    belief_before: 7, belief_after: 6,
    duration_seconds: 30, word: 'rater',
    ...over,
  }
}

describe('defusionData — hasMeasures', () => {
  it('vrai si avant OU après renseigné', () => {
    expect(hasMeasures(pt({}))).toBe(true)
    expect(hasMeasures(pt({ discomfort_before: null, belief_before: null, discomfort_after: 4, belief_after: 3 }))).toBe(true)
  })
  it('faux si les deux paires sont passées', () => {
    expect(hasMeasures(pt({ discomfort_before: null, belief_before: null, discomfort_after: null, belief_after: null }))).toBe(false)
  })
})

describe('defusionData — filterSessions', () => {
  const points = [
    pt({ date: '2026-07-10T10:00:00Z', technique: 'word_repetition' }),
    pt({ date: '2026-07-05T10:00:00Z', technique: 'linguistic_distancing' }),
    pt({ date: '2026-01-01T10:00:00Z', technique: 'word_repetition' }),
  ]

  it('filtre par technique', () => {
    expect(filterSessions(points, 'linguistic_distancing', 'all')).toHaveLength(1)
    expect(filterSessions(points, 'word_repetition', 'all')).toHaveLength(2)
  })

  it('« all » ne filtre pas la technique', () => {
    expect(filterSessions(points, 'all', 'all')).toHaveLength(3)
  })

  it('filtre par période (30 j depuis la plus récente)', () => {
    // Réf = 2026-07-10 ; 30 j exclut le 2026-01-01.
    expect(filterSessions(points, 'all', '1m').map(p => p.date.slice(0, 10)))
      .toEqual(['2026-07-10', '2026-07-05'])
  })
})

describe('defusionData — computeSynthesis', () => {
  it('compte total, avec mesures et dernière date', () => {
    const points = [
      pt({ date: '2026-07-10T10:00:00Z' }),
      pt({ date: '2026-07-01T10:00:00Z', discomfort_before: null, belief_before: null, discomfort_after: null, belief_after: null }),
    ]
    expect(computeSynthesis(points)).toEqual({ total: 2, withMeasures: 1, lastDate: '2026-07-10T10:00:00Z' })
  })

  it('jeu vide', () => {
    expect(computeSynthesis([])).toEqual({ total: 0, withMeasures: 0, lastDate: null })
  })
})

describe('defusionData — groupByMonth', () => {
  it('groupe par mois, plus récent d\'abord, séances récentes d\'abord', () => {
    const groups = groupByMonth([
      pt({ date: '2026-06-20T10:00:00Z' }),
      pt({ date: '2026-07-05T10:00:00Z' }),
      pt({ date: '2026-07-10T10:00:00Z' }),
    ])
    expect(groups.map(g => g.monthKey)).toEqual(['2026-07', '2026-06'])
    expect(groups[0].points.map(p => p.date.slice(0, 10))).toEqual(['2026-07-10', '2026-07-05'])
  })
})
