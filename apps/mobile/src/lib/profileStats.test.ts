import { trackingDays, formatSince } from './profileStats'

describe('profileStats.trackingDays', () => {
  it('compte les jours pleins écoulés depuis l\'inscription', () => {
    const created = '2025-03-01T10:00:00.000Z'
    const now = new Date('2025-03-11T10:00:00.000Z')
    expect(trackingDays(created, now)).toBe(10)
  })

  it('renvoie 0 le jour même de l\'inscription', () => {
    const created = '2025-03-01T08:00:00.000Z'
    const now = new Date('2025-03-01T20:00:00.000Z')
    expect(trackingDays(created, now)).toBe(0)
  })

  it('plancher à 0 pour une date d\'inscription future', () => {
    const created = '2025-06-01T00:00:00.000Z'
    const now = new Date('2025-03-01T00:00:00.000Z')
    expect(trackingDays(created, now)).toBe(0)
  })

  it('renvoie 0 pour une date invalide', () => {
    expect(trackingDays('pas-une-date', new Date())).toBe(0)
  })
})

describe('profileStats.formatSince', () => {
  it('formate le mois et l\'année dans la locale française', () => {
    expect(formatSince('2025-03-15T12:00:00.000Z', 'fr')).toBe('mars 2025')
  })

  it('formate le mois et l\'année dans la locale anglaise', () => {
    expect(formatSince('2025-03-15T12:00:00.000Z', 'en')).toBe('March 2025')
  })

  it('renvoie une chaîne vide si la date est nulle', () => {
    expect(formatSince(null, 'fr')).toBe('')
  })

  it('renvoie une chaîne vide si la date est invalide', () => {
    expect(formatSince('pas-une-date', 'fr')).toBe('')
  })
})
