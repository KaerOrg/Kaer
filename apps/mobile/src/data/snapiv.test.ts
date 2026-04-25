import { SNAPIV_DATA, SNAPIV_SUBSCALES, computeSNAPIVSubscaleScores } from './snapiv'

describe('SNAPIV_DATA', () => {
  it('contient exactement 26 items', () => {
    expect(SNAPIV_DATA.items).toHaveLength(26)
  })

  it('chaque item appartient à une sous-échelle valide', () => {
    const validSubscales = Object.keys(SNAPIV_SUBSCALES)
    SNAPIV_DATA.items.forEach(item => {
      expect(validSubscales).toContain(item.subscale)
    })
  })

  it('répartition par sous-échelle : 9 inattention, 9 hyperactivite, 8 tod', () => {
    const iCount  = SNAPIV_DATA.items.filter(i => i.subscale === 'inattention').length
    const hiCount = SNAPIV_DATA.items.filter(i => i.subscale === 'hyperactivite').length
    const todCount = SNAPIV_DATA.items.filter(i => i.subscale === 'tod').length
    expect(iCount).toBe(9)
    expect(hiCount).toBe(9)
    expect(todCount).toBe(8)
  })

  it('les 9 premiers items sont Inattention', () => {
    for (let i = 0; i < 9; i++) {
      expect(SNAPIV_DATA.items[i].subscale).toBe('inattention')
    }
  })

  it('les items 10-18 sont Hyperactivité-Impulsivité', () => {
    for (let i = 9; i < 18; i++) {
      expect(SNAPIV_DATA.items[i].subscale).toBe('hyperactivite')
    }
  })

  it('les items 19-26 sont TOD', () => {
    for (let i = 18; i < 26; i++) {
      expect(SNAPIV_DATA.items[i].subscale).toBe('tod')
    }
  })

  it('contient 4 options de réponse (0-3)', () => {
    expect(SNAPIV_DATA.options).toHaveLength(4)
    expect(SNAPIV_DATA.options.map(o => o.value)).toEqual([0, 1, 2, 3])
  })

  it('le score max par sous-échelle correspond au nombre d\'items × 3', () => {
    expect(SNAPIV_SUBSCALES.inattention.max).toBe(27)   // 9 × 3
    expect(SNAPIV_SUBSCALES.hyperactivite.max).toBe(27)  // 9 × 3
    expect(SNAPIV_SUBSCALES.tod.max).toBe(24)            // 8 × 3
  })
})

describe('computeSNAPIVSubscaleScores', () => {
  it('retourne 0 pour toutes les sous-échelles quand toutes les réponses sont 0', () => {
    const result = computeSNAPIVSubscaleScores(Array(26).fill(0))
    expect(result).toEqual({ inattention: 0, hyperactivite: 0, tod: 0 })
  })

  it('retourne les maximums quand toutes les réponses sont 3', () => {
    const result = computeSNAPIVSubscaleScores(Array(26).fill(3))
    expect(result.inattention).toBe(27)
    expect(result.hyperactivite).toBe(27)
    expect(result.tod).toBe(24)
  })

  it('la somme des scores sous-échelles est cohérente avec le total (toutes réponses = 2)', () => {
    const answers = Array(26).fill(2)
    const result = computeSNAPIVSubscaleScores(answers)
    const subscaleSum = Object.values(result).reduce((s, v) => s + v, 0)
    expect(subscaleSum).toBe(52)  // 26 × 2
  })

  it('calcule uniquement les sous-scores corrects avec des réponses partielles', () => {
    const answers = Array(26).fill(0)
    answers[0] = 3  // item 1 : inattention
    answers[9] = 2  // item 10 : hyperactivite
    answers[18] = 1 // item 19 : tod
    const result = computeSNAPIVSubscaleScores(answers)
    expect(result.inattention).toBe(3)
    expect(result.hyperactivite).toBe(2)
    expect(result.tod).toBe(1)
  })

  it('traite les valeurs null comme 0', () => {
    const answers = Array(26).fill(null)
    const result = computeSNAPIVSubscaleScores(answers)
    expect(result).toEqual({ inattention: 0, hyperactivite: 0, tod: 0 })
  })

  it('score total = somme des 3 sous-scores', () => {
    const answers = Array(26).fill(1)
    const result = computeSNAPIVSubscaleScores(answers)
    const total = result.inattention + result.hyperactivite + result.tod
    expect(total).toBe(26)
  })
})
