import {
  computeIdeationLevel,
  computeBehaviorCount,
  computeIdeationCount,
  isAbsoluteItemActive,
  CSSRS_SCREEN_TOTAL,
  CSSRS_IDEATION_COUNT,
  CSSRS_BEHAVIOR_COUNT,
  CSSRS_SCREEN_DATA,
} from './cssrs_screen'

describe('CSSRS_SCREEN_DATA — structure', () => {
  it('contient exactement 2 sections', () => {
    expect(CSSRS_SCREEN_DATA.sections).toHaveLength(2)
  })

  it('la section idéation contient 5 items', () => {
    expect(CSSRS_SCREEN_DATA.sections[0].items).toHaveLength(CSSRS_IDEATION_COUNT)
  })

  it('la section comportements contient 4 items', () => {
    expect(CSSRS_SCREEN_DATA.sections[1].items).toHaveLength(CSSRS_BEHAVIOR_COUNT)
  })

  it('le total est 9 items (5 idéation + 4 comportements)', () => {
    const total = CSSRS_SCREEN_DATA.sections.reduce((sum, s) => sum + s.items.length, 0)
    expect(total).toBe(CSSRS_SCREEN_TOTAL)
  })

  it('les clés de section sont idéation et comportements', () => {
    expect(CSSRS_SCREEN_DATA.sections[0].key).toBe('ideation')
    expect(CSSRS_SCREEN_DATA.sections[1].key).toBe('behavior')
  })

  it('chaque item a un label, une question non vide et un flag dependsOnPrev', () => {
    const allItems = CSSRS_SCREEN_DATA.sections.flatMap(s => s.items)
    allItems.forEach(item => {
      expect(typeof item.label).toBe('string')
      expect(item.label.length).toBeGreaterThan(0)
      expect(typeof item.question).toBe('string')
      expect(item.question.length).toBeGreaterThan(0)
      expect(typeof item.dependsOnPrev).toBe('boolean')
    })
  })

  it('Q1 et Q2 ne dépendent pas de la précédente (toujours posées)', () => {
    const [q1, q2] = CSSRS_SCREEN_DATA.sections[0].items
    expect(q1.dependsOnPrev).toBe(false)
    expect(q2.dependsOnPrev).toBe(false)
  })

  it('Q3, Q4 et Q5 dépendent de la précédente (arbre décisionnel)', () => {
    const [, , q3, q4, q5] = CSSRS_SCREEN_DATA.sections[0].items
    expect(q3.dependsOnPrev).toBe(true)
    expect(q4.dependsOnPrev).toBe(true)
    expect(q5.dependsOnPrev).toBe(true)
  })

  it('tous les items comportements sont indépendants (toujours posés)', () => {
    CSSRS_SCREEN_DATA.sections[1].items.forEach(item => {
      expect(item.dependsOnPrev).toBe(false)
    })
  })

  it('les 4 comportements ont les bons labels dans l\'ordre officiel', () => {
    const [b1, b2, b3, b4] = CSSRS_SCREEN_DATA.sections[1].items
    expect(b1.label).toBe('Tentative avérée')
    expect(b2.label).toBe('Tentative interrompue')
    expect(b3.label).toBe('Tentative avortée')
    expect(b4.label).toBe('Préparatifs')
  })

  it('Q2 ne contient pas "faire du mal" (confusion NSSI / idéation suicidaire)', () => {
    const q2 = CSSRS_SCREEN_DATA.sections[0].items[1]
    expect(q2.question).not.toMatch(/faire du mal/i)
  })

  it('Q2 contient "réellement" (formulation officielle Columbia)', () => {
    const q2 = CSSRS_SCREEN_DATA.sections[0].items[1]
    expect(q2.question).toMatch(/réellement/i)
  })

  it('Q5 contient "scénario détaillé" (formulation officielle Columbia)', () => {
    const q5 = CSSRS_SCREEN_DATA.sections[0].items[4]
    expect(q5.question).toMatch(/scénario détaillé/i)
  })

  it('aucun item ne contient de libellé interprétatif (seuil, risque, sévérité)', () => {
    const allItems = CSSRS_SCREEN_DATA.sections.flatMap(s => s.items)
    const forbidden = /risque|sévèr|élevé|critique|alerte|seuil|dangereux/i
    allItems.forEach(item => {
      expect(item.question).not.toMatch(forbidden)
    })
  })
})

describe('isAbsoluteItemActive — arbre décisionnel', () => {
  const allNull: (0 | 1 | null)[] = Array(CSSRS_SCREEN_TOTAL).fill(null)

  it('Q1 (index 0) est toujours active', () => {
    expect(isAbsoluteItemActive(0, allNull)).toBe(true)
    expect(isAbsoluteItemActive(0, Array(CSSRS_SCREEN_TOTAL).fill(0))).toBe(true)
  })

  it('Q2 (index 1) est toujours active', () => {
    expect(isAbsoluteItemActive(1, allNull)).toBe(true)
    expect(isAbsoluteItemActive(1, Array(CSSRS_SCREEN_TOTAL).fill(0))).toBe(true)
  })

  it('Q3 (index 2) inactive si Q2 = Non', () => {
    expect(isAbsoluteItemActive(2, [1, 0, null, null, null, ...Array(4).fill(null)])).toBe(false)
  })

  it('Q3 (index 2) active si Q2 = Oui', () => {
    expect(isAbsoluteItemActive(2, [0, 1, null, null, null, ...Array(4).fill(null)])).toBe(true)
  })

  it('Q3 (index 2) inactive si Q2 non encore répondu (null)', () => {
    expect(isAbsoluteItemActive(2, allNull)).toBe(false)
  })

  it('Q4 (index 3) inactive si Q2 = Non', () => {
    expect(isAbsoluteItemActive(3, [1, 0, null, null, null, ...Array(4).fill(null)])).toBe(false)
  })

  it('Q4 (index 3) inactive si Q2 = Oui mais Q3 = Non', () => {
    expect(isAbsoluteItemActive(3, [0, 1, 0, null, null, ...Array(4).fill(null)])).toBe(false)
  })

  it('Q4 (index 3) active si Q2 = Oui et Q3 = Oui', () => {
    expect(isAbsoluteItemActive(3, [0, 1, 1, null, null, ...Array(4).fill(null)])).toBe(true)
  })

  it('Q5 (index 4) inactive si Q2 = Non', () => {
    expect(isAbsoluteItemActive(4, [0, 0, null, null, null, ...Array(4).fill(null)])).toBe(false)
  })

  it('Q5 (index 4) inactive si Q2–Q3 = Oui mais Q4 = Non', () => {
    expect(isAbsoluteItemActive(4, [0, 1, 1, 0, null, ...Array(4).fill(null)])).toBe(false)
  })

  it('Q5 (index 4) active si Q2, Q3, Q4 = Oui', () => {
    expect(isAbsoluteItemActive(4, [0, 1, 1, 1, null, ...Array(4).fill(null)])).toBe(true)
  })

  it('B1–B4 (indices 5–8) toujours actifs quelles que soient les réponses', () => {
    for (let i = 5; i < CSSRS_SCREEN_TOTAL; i++) {
      expect(isAbsoluteItemActive(i, allNull)).toBe(true)
      expect(isAbsoluteItemActive(i, Array(CSSRS_SCREEN_TOTAL).fill(0))).toBe(true)
    }
  })
})

describe('computeIdeationLevel', () => {
  const b = Array(CSSRS_BEHAVIOR_COUNT).fill(0)

  it('retourne 0 si toutes les réponses d\'idéation sont 0', () => {
    expect(computeIdeationLevel([0, 0, 0, 0, 0, ...b])).toBe(0)
  })

  it('retourne 1 si seul le premier item est endorsé (désir de mort)', () => {
    expect(computeIdeationLevel([1, 0, 0, 0, 0, ...b])).toBe(1)
  })

  it('retourne 2 si Q2 endorsé (idéation non spécifique)', () => {
    expect(computeIdeationLevel([0, 1, 0, 0, 0, ...b])).toBe(2)
  })

  it('retourne 5 si Q5 endorsé (scénario + intention)', () => {
    expect(computeIdeationLevel([0, 0, 0, 0, 1, ...b])).toBe(5)
  })

  it('retourne le niveau le plus élevé endorsé parmi plusieurs', () => {
    expect(computeIdeationLevel([1, 1, 1, 0, 0, ...b])).toBe(3)
  })

  it('retourne 5 si tous les items d\'idéation sont endorsés', () => {
    expect(computeIdeationLevel([1, 1, 1, 1, 1, ...b])).toBe(5)
  })

  it('ignore les items comportements (indices 5-8)', () => {
    expect(computeIdeationLevel([0, 0, 0, 0, 0, 1, 1, 1, 1])).toBe(0)
  })

  it('retourne 3 si item 3 endorsé mais pas 4 ni 5', () => {
    expect(computeIdeationLevel([0, 0, 1, 0, 0, ...b])).toBe(3)
  })
})

describe('computeBehaviorCount', () => {
  const i = Array(CSSRS_IDEATION_COUNT).fill(0)

  it('retourne 0 si aucun comportement', () => {
    expect(computeBehaviorCount([...i, 0, 0, 0, 0])).toBe(0)
  })

  it('retourne 4 si tous les comportements sont endorsés', () => {
    expect(computeBehaviorCount([...i, 1, 1, 1, 1])).toBe(4)
  })

  it('ne compte que les indices 5-8 (comportements)', () => {
    expect(computeBehaviorCount([1, 1, 1, 1, 1, 0, 0, 0, 0])).toBe(0)
  })

  it('retourne 1 si seul B1 (tentative avérée) est endorsé', () => {
    expect(computeBehaviorCount([...i, 1, 0, 0, 0])).toBe(1)
  })

  it('retourne 1 si seuls les préparatifs sont endorsés', () => {
    expect(computeBehaviorCount([...i, 0, 0, 0, 1])).toBe(1)
  })

  it('retourne 2 si tentative avérée + préparatifs', () => {
    expect(computeBehaviorCount([...i, 1, 0, 0, 1])).toBe(2)
  })
})

describe('computeIdeationCount', () => {
  it('retourne 0 si aucune idéation', () => {
    expect(computeIdeationCount([0, 0, 0, 0, 0, 1, 1, 1, 1])).toBe(0)
  })

  it('retourne 5 si toutes les idéations endorsées', () => {
    expect(computeIdeationCount([1, 1, 1, 1, 1, 0, 0, 0, 0])).toBe(5)
  })

  it('retourne 2 pour désir de mort + idéation non spécifique', () => {
    expect(computeIdeationCount([1, 1, 0, 0, 0, 0, 0, 0, 0])).toBe(2)
  })

  it('ignore les items comportements', () => {
    expect(computeIdeationCount([0, 0, 0, 0, 0, 1, 1, 1, 1])).toBe(0)
  })
})

describe('cohérence entre fonctions de score', () => {
  it('tableau tout à 0 : tous les scores sont 0', () => {
    const allZero = Array(CSSRS_SCREEN_TOTAL).fill(0)
    expect(computeIdeationLevel(allZero)).toBe(0)
    expect(computeIdeationCount(allZero)).toBe(0)
    expect(computeBehaviorCount(allZero)).toBe(0)
  })

  it('tableau tout à 1 : scores maximaux', () => {
    const allOne = Array(CSSRS_SCREEN_TOTAL).fill(1)
    expect(computeIdeationLevel(allOne)).toBe(5)
    expect(computeIdeationCount(allOne)).toBe(5)
    expect(computeBehaviorCount(allOne)).toBe(4)
  })
})
