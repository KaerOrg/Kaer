import { computeBalanceScores } from '../../lib/database'
import { BalanceArgument, DecisionalBalance } from '../../lib/database'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeArg(weight: number): BalanceArgument {
  return { id: 'test-' + weight, text: 'argument', weight }
}

function makeBalance(
  prosChange: number[],
  consChange: number[],
  prosStatusQuo: number[],
  consStatusQuo: number[]
): Pick<DecisionalBalance, 'pros_change' | 'cons_change' | 'pros_status_quo' | 'cons_status_quo'> {
  return {
    pros_change: prosChange.map(makeArg),
    cons_change: consChange.map(makeArg),
    pros_status_quo: prosStatusQuo.map(makeArg),
    cons_status_quo: consStatusQuo.map(makeArg),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeBalanceScores', () => {
  it('retourne 50% de motivation quand tout est vide', () => {
    const scores = computeBalanceScores(makeBalance([], [], [], []))
    expect(scores.changeScore).toBe(0)
    expect(scores.statusQuoScore).toBe(0)
    expect(scores.motivationPercent).toBe(50)
  })

  it('calcule correctement le changeScore (somme des poids pros_change)', () => {
    const scores = computeBalanceScores(makeBalance([3, 5, 2], [], [], []))
    expect(scores.changeScore).toBe(10)
  })

  it('calcule correctement le statusQuoScore (somme des poids pros_status_quo)', () => {
    const scores = computeBalanceScores(makeBalance([], [], [4, 1], []))
    expect(scores.statusQuoScore).toBe(5)
  })

  it('cons_change et cons_status_quo n\'influencent pas les scores de la jauge', () => {
    const withCons = computeBalanceScores(makeBalance([3], [5, 5, 5], [2], [4, 4, 4]))
    const withoutCons = computeBalanceScores(makeBalance([3], [], [2], []))
    expect(withCons.changeScore).toBe(withoutCons.changeScore)
    expect(withCons.statusQuoScore).toBe(withoutCons.statusQuoScore)
    expect(withCons.motivationPercent).toBe(withoutCons.motivationPercent)
  })

  it('retourne 100% quand seul le changement a des arguments', () => {
    const scores = computeBalanceScores(makeBalance([4, 3], [], [], []))
    expect(scores.motivationPercent).toBe(100)
  })

  it('retourne 0% quand seul le statu quo a des arguments', () => {
    const scores = computeBalanceScores(makeBalance([], [], [2, 5], []))
    expect(scores.motivationPercent).toBe(0)
  })

  it('calcule correctement la proportion changement vs statu quo', () => {
    // changeScore = 6, statusQuoScore = 4, total = 10, 6/10 = 60%
    const scores = computeBalanceScores(makeBalance([3, 3], [], [2, 2], []))
    expect(scores.changeScore).toBe(6)
    expect(scores.statusQuoScore).toBe(4)
    expect(scores.motivationPercent).toBe(60)
  })

  it('arrondit le pourcentage à l\'entier le plus proche', () => {
    // changeScore = 1, statusQuoScore = 3, total = 4, 1/4 = 25%
    const scores = computeBalanceScores(makeBalance([1], [], [3], []))
    expect(scores.motivationPercent).toBe(25)
  })

  it('accepte des poids de 1 à 5 sans erreur', () => {
    const scores = computeBalanceScores(makeBalance([1, 2, 3, 4, 5], [], [5, 4, 3, 2, 1], []))
    expect(scores.changeScore).toBe(15)
    expect(scores.statusQuoScore).toBe(15)
    expect(scores.motivationPercent).toBe(50)
  })

  it('plafonne motivationPercent à 100 même si les poids dépassent 5 (données corrompues)', () => {
    const scores = computeBalanceScores(makeBalance([999], [], [1], []))
    expect(scores.motivationPercent).toBeLessThanOrEqual(100)
    expect(scores.motivationPercent).toBeGreaterThanOrEqual(0)
  })
})
