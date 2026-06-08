import { describe, it, expect } from 'vitest'
import { readDimensions, readTotalScore } from './summaryReaders'

describe('summaryReaders.readDimensions', () => {
  it('extrait chaque sous-échelle numérique de subscale_scores', () => {
    expect(readDimensions({ subscale_scores: { humeur: 7, energie: 6 } })).toEqual([
      { key: 'humeur', value: 7 },
      { key: 'energie', value: 6 },
    ])
  })

  it('coerce les valeurs string et ignore les non-numériques', () => {
    expect(readDimensions({ subscale_scores: { a: '3', b: 'x', c: 5 } })).toEqual([
      { key: 'a', value: 3 },
      { key: 'c', value: 5 },
    ])
  })

  it('retourne [] si payload null ou subscale_scores absent', () => {
    expect(readDimensions(null)).toEqual([])
    expect(readDimensions({ total_score: 10 })).toEqual([])
    expect(readDimensions({ subscale_scores: null })).toEqual([])
  })
})

describe('summaryReaders.readTotalScore', () => {
  it('retourne total_score coercé en number', () => {
    expect(readTotalScore({ total_score: 12 })).toBe(12)
    expect(readTotalScore({ total_score: '8' })).toBe(8)
  })

  it('retourne null si absent, non-numérique ou payload null', () => {
    expect(readTotalScore(null)).toBeNull()
    expect(readTotalScore({})).toBeNull()
    expect(readTotalScore({ total_score: 'abc' })).toBeNull()
  })
})
