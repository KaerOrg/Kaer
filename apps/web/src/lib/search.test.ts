import { describe, it, expect } from 'vitest'
import { normalizeSearch, tokenizeSearch, matchesAllTokens } from './search'

describe('normalizeSearch', () => {
  it('met en minuscules et retire les accents', () => {
    expect(normalizeSearch('François')).toBe('francois')
    expect(normalizeSearch('Élodie ')).toBe('elodie')
    expect(normalizeSearch('  ÄÖÜß ')).toBe('aoüß'.replace('ü', 'u'))
  })

  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(normalizeSearch('')).toBe('')
    expect(normalizeSearch('   ')).toBe('')
  })
})

describe('tokenizeSearch', () => {
  it('découpe sur les espaces et retire les tokens vides', () => {
    expect(tokenizeSearch('Jean  Dupont')).toEqual(['jean', 'dupont'])
    expect(tokenizeSearch('  marie ')).toEqual(['marie'])
  })

  it('normalise chaque token', () => {
    expect(tokenizeSearch('François DUPONT')).toEqual(['francois', 'dupont'])
  })

  it('renvoie [] sur entrée vide', () => {
    expect(tokenizeSearch('')).toEqual([])
    expect(tokenizeSearch('   ')).toEqual([])
  })
})

describe('matchesAllTokens', () => {
  it('vrai si tous les tokens sont présents quelle que soit la casse ou les accents', () => {
    expect(matchesAllTokens('Jean Dupont jean@t.fr', ['jean', 'dupont'])).toBe(true)
    expect(matchesAllTokens('François Élodie', ['francois'])).toBe(true)
  })

  it("vrai si les tokens sont dans l'ordre inverse du haystack", () => {
    expect(matchesAllTokens('Jean Dupont', ['dupont', 'jean'])).toBe(true)
  })

  it('faux si un token est absent', () => {
    expect(matchesAllTokens('Jean Dupont', ['marie'])).toBe(false)
  })

  it('vrai sur match partiel (sous-chaîne)', () => {
    expect(matchesAllTokens('Jean Dupont', ['jea', 'dup'])).toBe(true)
  })
})
