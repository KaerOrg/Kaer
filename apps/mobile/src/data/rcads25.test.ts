import { RCADS25_DATA, RCADS25_SUBSCALES, computeSubscaleScores } from './rcads25'

describe('RCADS25_DATA', () => {
  it('contient exactement 25 items', () => {
    expect(RCADS25_DATA.items).toHaveLength(25)
  })

  it('chaque item appartient à une sous-échelle valide', () => {
    const validSubscales = Object.keys(RCADS25_SUBSCALES)
    RCADS25_DATA.items.forEach(item => {
      expect(validSubscales).toContain(item.subscale)
    })
  })

  it('répartition par sous-échelle : 5 TAG, 4 TP, 5 TS, 4 PS, 2 TOC, 5 TD', () => {
    const tagCount = RCADS25_DATA.items.filter(i => i.subscale === 'tag').length
    const tpCount  = RCADS25_DATA.items.filter(i => i.subscale === 'tp').length
    const tsCount  = RCADS25_DATA.items.filter(i => i.subscale === 'ts').length
    const psCount  = RCADS25_DATA.items.filter(i => i.subscale === 'ps').length
    const tocCount = RCADS25_DATA.items.filter(i => i.subscale === 'toc').length
    const tdCount  = RCADS25_DATA.items.filter(i => i.subscale === 'td').length
    expect(tagCount).toBe(5)
    expect(tpCount).toBe(4)
    expect(tsCount).toBe(5)
    expect(psCount).toBe(4)
    expect(tocCount).toBe(2)
    expect(tdCount).toBe(5)
  })

  it('contient 4 options de réponse (0-3)', () => {
    expect(RCADS25_DATA.options).toHaveLength(4)
    expect(RCADS25_DATA.options.map(o => o.value)).toEqual([0, 1, 2, 3])
  })
})

describe('computeSubscaleScores', () => {
  it('retourne 0 pour toutes les sous-échelles quand toutes les réponses sont 0', () => {
    const result = computeSubscaleScores(Array(25).fill(0))
    expect(result).toEqual({ tag: 0, tp: 0, ts: 0, ps: 0, toc: 0, td: 0 })
  })

  it('retourne les maximums quand toutes les réponses sont 3', () => {
    const result = computeSubscaleScores(Array(25).fill(3))
    expect(result.tag).toBe(15)
    expect(result.tp).toBe(12)
    expect(result.ts).toBe(15)
    expect(result.ps).toBe(12)
    expect(result.toc).toBe(6)
    expect(result.td).toBe(15)
  })

  it('la somme des scores sous-échelles est cohérente avec le total', () => {
    const answers = Array(25).fill(2)
    const result = computeSubscaleScores(answers)
    const subscaleSum = Object.values(result).reduce(function(s, v) { return s + v }, 0)
    expect(subscaleSum).toBe(50)
  })

  it('traite les valeurs null comme 0', () => {
    const answers = Array(25).fill(null)
    const result = computeSubscaleScores(answers)
    expect(result).toEqual({ tag: 0, tp: 0, ts: 0, ps: 0, toc: 0, td: 0 })
  })
})
