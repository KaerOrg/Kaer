import { NSI_DATA, NSI_ITEMS, computeNSIScore } from './nsi'

describe('NSI_ITEMS', () => {
  it('contient exactement 9 items', () => {
    expect(NSI_ITEMS).toHaveLength(9)
  })

  it('chaque item possède exactement 6 options de réponse', () => {
    NSI_ITEMS.forEach((item, i) => {
      expect(item.options).toHaveLength(6), `item ${i + 1}`
    })
  })

  it('chaque option a une valeur entre 0 et 5', () => {
    NSI_ITEMS.forEach((item, i) => {
      item.options.forEach(opt => {
        expect(opt.value).toBeGreaterThanOrEqual(0), `item ${i + 1}`
        expect(opt.value).toBeLessThanOrEqual(5), `item ${i + 1}`
      })
    })
  })

  it('chaque item a les 6 valeurs distinctes 0 à 5', () => {
    NSI_ITEMS.forEach((item, i) => {
      const values = item.options.map(o => o.value).sort((a, b) => a - b)
      expect(values).toEqual([0, 1, 2, 3, 4, 5]), `item ${i + 1}`
    })
  })

  it('items 1 et 3 (fréquence) ont des options textuelles', () => {
    expect(NSI_ITEMS[0].options[0].text).not.toBe('0')
    expect(NSI_ITEMS[2].options[0].text).not.toBe('0')
  })

  it('items 2, 4-9 ont des options numériques avec ancres', () => {
    const numericIndexes = [1, 3, 4, 5, 6, 7, 8]
    numericIndexes.forEach(i => {
      expect(NSI_ITEMS[i].options[0].text).toBe('0'), `item ${i + 1}`
      expect(NSI_ITEMS[i].anchors).toBeDefined(), `item ${i + 1}`
    })
  })

  it('items 1 et 3 n\'ont pas d\'ancres (options avec texte explicite)', () => {
    expect(NSI_ITEMS[0].anchors).toBeUndefined()
    expect(NSI_ITEMS[2].anchors).toBeUndefined()
  })

  it('NSI_DATA référence les mêmes items', () => {
    expect(NSI_DATA.items).toHaveLength(9)
  })
})

describe('computeNSIScore', () => {
  it('retourne 0 quand toutes les réponses sont 0', () => {
    expect(computeNSIScore(Array(9).fill(0))).toBe(0)
  })

  it('retourne 45 quand toutes les réponses sont 5 (score maximum)', () => {
    expect(computeNSIScore(Array(9).fill(5))).toBe(45)
  })

  it('traite les valeurs null comme 0', () => {
    expect(computeNSIScore(Array(9).fill(null))).toBe(0)
  })

  it('additionne correctement un tableau mixte', () => {
    // 5+3+4+2+1+0+5+3+2 = 25
    const answers = [5, 3, 4, 2, 1, 0, 5, 3, 2]
    expect(computeNSIScore(answers)).toBe(25)
  })

  it('ignore les nulls dans un tableau mixte', () => {
    const answers: (number | null)[] = [5, null, 3, null, 2, 1, null, 4, 2]
    // 5+0+3+0+2+1+0+4+2 = 17
    expect(computeNSIScore(answers)).toBe(17)
  })

  it('retourne un score entier', () => {
    const score = computeNSIScore([1, 2, 3, 4, 5, 0, 1, 2, 3])
    expect(Number.isInteger(score)).toBe(true)
  })
})
