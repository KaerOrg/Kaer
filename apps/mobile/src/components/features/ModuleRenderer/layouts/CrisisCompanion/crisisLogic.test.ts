import {
  parseDurations,
  formatCountdown,
  nextActivityIndex,
  elapsedFraction,
  DEFAULT_DURATIONS,
} from './crisisLogic'

describe('crisisLogic — parseDurations', () => {
  it('parse une liste valide', () => {
    expect(parseDurations('5,15')).toEqual([5, 15])
  })

  it('ignore les espaces et les valeurs non numériques ou négatives', () => {
    expect(parseDurations(' 3 , x, -2, 10 ')).toEqual([3, 10])
  })

  it('retombe sur les durées par défaut si vide ou invalide', () => {
    expect(parseDurations(undefined)).toEqual([...DEFAULT_DURATIONS])
    expect(parseDurations('')).toEqual([...DEFAULT_DURATIONS])
    expect(parseDurations('abc')).toEqual([...DEFAULT_DURATIONS])
  })
})

describe('crisisLogic — formatCountdown', () => {
  it('formate en M:SS', () => {
    expect(formatCountdown(300)).toBe('5:00')
    expect(formatCountdown(90)).toBe('1:30')
    expect(formatCountdown(5)).toBe('0:05')
  })

  it('borne à 0 pour les valeurs négatives', () => {
    expect(formatCountdown(-10)).toBe('0:00')
  })
})

describe('crisisLogic — nextActivityIndex', () => {
  it('tourne de façon circulaire', () => {
    expect(nextActivityIndex(0, 3)).toBe(1)
    expect(nextActivityIndex(2, 3)).toBe(0)
  })

  it('retourne 0 si la liste est vide', () => {
    expect(nextActivityIndex(0, 0)).toBe(0)
  })
})

describe('crisisLogic — elapsedFraction', () => {
  it('calcule la fraction écoulée bornée à [0,1]', () => {
    expect(elapsedFraction(300, 300)).toBe(0)
    expect(elapsedFraction(150, 300)).toBe(0.5)
    expect(elapsedFraction(0, 300)).toBe(1)
  })

  it('retourne 0 si la durée totale est nulle', () => {
    expect(elapsedFraction(0, 0)).toBe(0)
  })
})
