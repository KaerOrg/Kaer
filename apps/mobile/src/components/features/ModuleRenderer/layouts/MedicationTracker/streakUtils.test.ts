import { computeLoggedStreak, shiftDate } from './streakUtils'

describe('shiftDate', () => {
  it('décale correctement, passage de mois', () => {
    expect(shiftDate('2025-03-01', -1)).toBe('2025-02-28')
    expect(shiftDate('2025-02-28', 1)).toBe('2025-03-01')
  })
})

describe('computeLoggedStreak', () => {
  it('compte les jours consécutifs se terminant aujourd\'hui', () => {
    const dates = new Set(['2025-06-07', '2025-06-08', '2025-06-09'])
    expect(computeLoggedStreak(dates, '2025-06-09')).toBe(3)
  })

  it('court jusqu\'à hier si aujourd\'hui pas encore renseigné', () => {
    const dates = new Set(['2025-06-07', '2025-06-08'])
    expect(computeLoggedStreak(dates, '2025-06-09')).toBe(2)
  })

  it('s\'arrête au premier trou', () => {
    const dates = new Set(['2025-06-05', '2025-06-08', '2025-06-09'])
    expect(computeLoggedStreak(dates, '2025-06-09')).toBe(2)
  })

  it('ne casse pas la série sur un jour renseigné « missed » (on compte le suivi, pas la prise)', () => {
    // missed est renseigné → présent dans loggedDates ; la série tient.
    const dates = new Set(['2025-06-07', '2025-06-08', '2025-06-09'])
    expect(computeLoggedStreak(dates, '2025-06-09')).toBe(3)
  })

  it('retourne 0 si rien de récent', () => {
    expect(computeLoggedStreak(new Set(['2025-01-01']), '2025-06-09')).toBe(0)
    expect(computeLoggedStreak(new Set(), '2025-06-09')).toBe(0)
  })
})
