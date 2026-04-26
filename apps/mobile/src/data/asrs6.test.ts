import { ASRS6_DATA, computeASRS6Score } from './asrs6'

describe('ASRS6_DATA', () => {
  it('contient exactement 6 items', () => {
    expect(ASRS6_DATA.items).toHaveLength(6)
  })

  it('contient 5 options de réponse (0-4)', () => {
    expect(ASRS6_DATA.options).toHaveLength(5)
    expect(ASRS6_DATA.options.map(o => o.value)).toEqual([0, 1, 2, 3, 4])
  })

  it('chaque item est une chaîne non vide', () => {
    ASRS6_DATA.items.forEach(item => {
      expect(typeof item).toBe('string')
      expect(item.length).toBeGreaterThan(0)
    })
  })

  it('les options vont de Jamais à Très souvent', () => {
    expect(ASRS6_DATA.options[0].text).toBe('Jamais')
    expect(ASRS6_DATA.options[4].text).toBe('Très souvent')
  })
})

describe('computeASRS6Score', () => {
  it('retourne 0 quand toutes les réponses sont 0', () => {
    expect(computeASRS6Score(Array(6).fill(0))).toBe(0)
  })

  it('retourne 24 quand toutes les réponses sont 4 (maximum)', () => {
    expect(computeASRS6Score(Array(6).fill(4))).toBe(24)
  })

  it('calcule correctement la somme des réponses mixtes', () => {
    expect(computeASRS6Score([0, 1, 2, 3, 4, 2])).toBe(12)
  })

  it('traite les valeurs null comme 0', () => {
    expect(computeASRS6Score(Array(6).fill(null))).toBe(0)
  })

  it('retourne le score correct pour 6 réponses à 1', () => {
    expect(computeASRS6Score(Array(6).fill(1))).toBe(6)
  })

  it('retourne le score correct pour 6 réponses à 3', () => {
    expect(computeASRS6Score(Array(6).fill(3))).toBe(18)
  })
})
