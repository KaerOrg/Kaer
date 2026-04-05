import { computeSleepDuration, generateId } from './database'

describe('computeSleepDuration', () => {
  it('calcule une durée simple (même jour)', () => {
    expect(computeSleepDuration('22:00', '06:00')).toBe('8h00')
  })

  it('calcule une durée avec passage à minuit', () => {
    expect(computeSleepDuration('23:30', '07:00')).toBe('7h30')
  })

  it("soustrait le temps d'endormissement", () => {
    expect(computeSleepDuration('22:00', '06:00', 30)).toBe('7h30')
  })

  it('gère les minutes non nulles dans le résultat', () => {
    expect(computeSleepDuration('22:15', '06:30')).toBe('8h15')
  })

  it('retourne 0h00 si coucher == réveil', () => {
    expect(computeSleepDuration('08:00', '08:00')).toBe('0h00')
  })

  it('formate les minutes avec un zéro initial si < 10', () => {
    expect(computeSleepDuration('22:00', '05:05')).toBe('7h05')
  })
})

describe('generateId', () => {
  it('retourne une string non vide', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('génère des identifiants uniques', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
