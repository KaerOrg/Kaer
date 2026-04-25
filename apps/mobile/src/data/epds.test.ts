import { EPDS_DATA, EPDS_ITEMS, computeEPDSScore } from './epds'

describe('EPDS_ITEMS', () => {
  it('contient exactement 10 items', () => {
    expect(EPDS_ITEMS).toHaveLength(10)
  })

  it('chaque item possède 4 options de réponse', () => {
    EPDS_ITEMS.forEach((item, i) => {
      expect(item.options).toHaveLength(4), `item ${i + 1}`
    })
  })

  it('chaque option a une valeur entre 0 et 3', () => {
    EPDS_ITEMS.forEach((item, i) => {
      item.options.forEach(opt => {
        expect(opt.value).toBeGreaterThanOrEqual(0), `item ${i + 1}`
        expect(opt.value).toBeLessThanOrEqual(3), `item ${i + 1}`
      })
    })
  })

  it('items 1, 2, 4 ont un scoring normal (première option = 0)', () => {
    expect(EPDS_ITEMS[0].options[0].value).toBe(0)  // item 1
    expect(EPDS_ITEMS[1].options[0].value).toBe(0)  // item 2
    expect(EPDS_ITEMS[3].options[0].value).toBe(0)  // item 4
  })

  it('items 3, 5–10 ont un scoring inversé (première option = 3)', () => {
    const reversedIndexes = [2, 4, 5, 6, 7, 8, 9]
    reversedIndexes.forEach(i => {
      expect(EPDS_ITEMS[i].options[0].value).toBe(3), `item ${i + 1}`
    })
  })

  it('chaque item a les 4 valeurs distinctes 0, 1, 2, 3', () => {
    EPDS_ITEMS.forEach((item, i) => {
      const values = item.options.map(o => o.value).sort()
      expect(values).toEqual([0, 1, 2, 3]), `item ${i + 1}`
    })
  })

  it('EPDS_DATA référence les mêmes items', () => {
    expect(EPDS_DATA.items).toHaveLength(10)
  })
})

describe('computeEPDSScore', () => {
  it('retourne 0 quand toutes les réponses sont 0', () => {
    expect(computeEPDSScore(Array(10).fill(0))).toBe(0)
  })

  it('retourne 30 quand toutes les réponses sont 3 (score maximum)', () => {
    expect(computeEPDSScore(Array(10).fill(3))).toBe(30)
  })

  it('traite les valeurs null comme 0', () => {
    expect(computeEPDSScore(Array(10).fill(null))).toBe(0)
  })

  it('additionne correctement un tableau mixte', () => {
    // 1+0+3+2+1+0+2+1+3+0 = 13
    const answers = [1, 0, 3, 2, 1, 0, 2, 1, 3, 0]
    expect(computeEPDSScore(answers)).toBe(13)
  })

  it('ignore les nulls dans un tableau mixte', () => {
    const answers: (number | null)[] = [3, null, 2, null, 1, 0, null, 3, 2, 1]
    // 3+0+2+0+1+0+0+3+2+1 = 12
    expect(computeEPDSScore(answers)).toBe(12)
  })

  it('retourne un score entier', () => {
    const score = computeEPDSScore([1, 2, 3, 0, 1, 2, 3, 0, 1, 2])
    expect(Number.isInteger(score)).toBe(true)
  })
})
