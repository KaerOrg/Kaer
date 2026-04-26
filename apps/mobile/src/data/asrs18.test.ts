import { ASRS18_DATA, ASRS18_PARTS, computeASRS18SubScores } from './asrs18'

describe('ASRS18_DATA', () => {
  it('contient exactement 18 items', () => {
    expect(ASRS18_DATA.items).toHaveLength(18)
  })

  it('les 6 premiers items appartiennent à la Partie A', () => {
    for (let i = 0; i < 6; i++) {
      expect(ASRS18_DATA.items[i].part).toBe('part_a')
    }
  })

  it('les items 7–18 appartiennent à la Partie B', () => {
    for (let i = 6; i < 18; i++) {
      expect(ASRS18_DATA.items[i].part).toBe('part_b')
    }
  })

  it('répartition : 6 Partie A + 12 Partie B', () => {
    const aCount = ASRS18_DATA.items.filter(i => i.part === 'part_a').length
    const bCount = ASRS18_DATA.items.filter(i => i.part === 'part_b').length
    expect(aCount).toBe(6)
    expect(bCount).toBe(12)
  })

  it('contient 5 options de réponse (0-4)', () => {
    expect(ASRS18_DATA.options).toHaveLength(5)
    expect(ASRS18_DATA.options.map(o => o.value)).toEqual([0, 1, 2, 3, 4])
  })

  it('chaque item est une chaîne non vide', () => {
    ASRS18_DATA.items.forEach(item => {
      expect(typeof item.question).toBe('string')
      expect(item.question.length).toBeGreaterThan(0)
    })
  })

  it('le max de Partie A est 24 (6 items × 4)', () => {
    expect(ASRS18_PARTS.part_a.max).toBe(24)
  })

  it('le max de Partie B est 48 (12 items × 4)', () => {
    expect(ASRS18_PARTS.part_b.max).toBe(48)
  })
})

describe('computeASRS18SubScores', () => {
  it('retourne 0 partout quand toutes les réponses sont 0', () => {
    const result = computeASRS18SubScores(Array(18).fill(0))
    expect(result).toEqual({ part_a: 0, part_b: 0 })
  })

  it('retourne les maximums quand toutes les réponses sont 4', () => {
    const result = computeASRS18SubScores(Array(18).fill(4))
    expect(result.part_a).toBe(24)
    expect(result.part_b).toBe(48)
  })

  it('la somme des sous-scores est cohérente avec le total (toutes réponses = 2)', () => {
    const result = computeASRS18SubScores(Array(18).fill(2))
    expect(result.part_a).toBe(12)  // 6 × 2
    expect(result.part_b).toBe(24)  // 12 × 2
    expect(result.part_a + result.part_b).toBe(36)  // 18 × 2
  })

  it('calcule uniquement la Partie A correctement avec réponses partielles', () => {
    const answers = Array(18).fill(0)
    answers[0] = 3
    answers[2] = 4
    const result = computeASRS18SubScores(answers)
    expect(result.part_a).toBe(7)
    expect(result.part_b).toBe(0)
  })

  it('calcule uniquement la Partie B correctement avec réponses partielles', () => {
    const answers = Array(18).fill(0)
    answers[6] = 2   // premier item Partie B
    answers[17] = 3  // dernier item Partie B
    const result = computeASRS18SubScores(answers)
    expect(result.part_a).toBe(0)
    expect(result.part_b).toBe(5)
  })

  it('traite les valeurs null comme 0', () => {
    const result = computeASRS18SubScores(Array(18).fill(null))
    expect(result).toEqual({ part_a: 0, part_b: 0 })
  })

  it('total = part_a + part_b pour toutes réponses = 1', () => {
    const result = computeASRS18SubScores(Array(18).fill(1))
    expect(result.part_a + result.part_b).toBe(18)
  })
})
