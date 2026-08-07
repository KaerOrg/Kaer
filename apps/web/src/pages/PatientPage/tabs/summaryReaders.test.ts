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

  it('ne ramasse pas un item posé hors score (#410)', () => {
    // Le PHQ-9 pose dix questions et n'en additionne que neuf : l'item 10 mesure le
    // retentissement fonctionnel et n'entre pas dans le total sur 27. Le lecteur ne
    // recalcule rien à partir de `answers`, il lit le total tel qu'il a été enregistré
    // par le mobile. Cette lecture ne peut donc pas gonfler avec un item posé de plus.
    const payload = { total_score: 14, answers: [2, 2, 2, 2, 2, 2, 1, 1, 0, 3] }
    expect(readTotalScore(payload)).toBe(14)
  })

  it('rend le même total pour une passation à 9 réponses et une à 10 (#410)', () => {
    // Rétrocompatibilité : les passations enregistrées avant l'arrivée de l'item 10
    // gardent exactement leur score, la série reste comparable.
    const before = { total_score: 14, answers: [2, 2, 2, 2, 2, 2, 1, 1, 0] }
    const after = { total_score: 14, answers: [2, 2, 2, 2, 2, 2, 1, 1, 0, 3] }
    expect(readTotalScore(after)).toBe(readTotalScore(before))
  })
})
