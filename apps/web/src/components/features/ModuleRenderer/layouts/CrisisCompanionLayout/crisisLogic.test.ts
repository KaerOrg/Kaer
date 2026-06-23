import { describe, it, expect } from 'vitest'
import { parseDurations, DEFAULT_DURATIONS } from './crisisLogic'

// Miroir du test mobile (CrisisCompanion/crisisLogic.test.ts) pour parseDurations.
// La parité web ≡ mobile sur la lecture des durées indexées (`duration_1`, …)
// est garantie par le helper partagé collectIndexed + cette logique identique.
describe('crisisLogic — parseDurations', () => {
  it('parse les valeurs indexées valides', () => {
    expect(parseDurations(['5', '15'])).toEqual([5, 15])
  })

  it('ignore les espaces et les valeurs non numériques ou négatives', () => {
    expect(parseDurations([' 3 ', 'x', '-2', '10 '])).toEqual([3, 10])
  })

  it('retombe sur les durées par défaut si vide ou invalide', () => {
    expect(parseDurations(undefined)).toEqual([...DEFAULT_DURATIONS])
    expect(parseDurations([])).toEqual([...DEFAULT_DURATIONS])
    expect(parseDurations(['abc'])).toEqual([...DEFAULT_DURATIONS])
  })
})
