import { describe, it, expect } from 'vitest'
import {
  parseTimeToMinutes,
  circularSdMinutes,
  computeAnchorRegularity,
} from './anchorRegularity'

describe('parseTimeToMinutes', () => {
  it('parse HH:MM en minutes', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('07:30')).toBe(450)
    expect(parseTimeToMinutes('23:59')).toBe(1439)
  })

  it('renvoie null pour vide ou invalide', () => {
    expect(parseTimeToMinutes('')).toBeNull()
    expect(parseTimeToMinutes('foo')).toBeNull()
    expect(parseTimeToMinutes('25:00')).toBeNull()
    expect(parseTimeToMinutes('12:60')).toBeNull()
    expect(parseTimeToMinutes(null)).toBeNull()
    expect(parseTimeToMinutes(700)).toBeNull()
  })
})

describe('circularSdMinutes', () => {
  it('renvoie 0 pour des horaires identiques', () => {
    expect(circularSdMinutes([600, 600, 600])).toBe(0)
  })

  it('renvoie 0 pour moins de 2 valeurs', () => {
    expect(circularSdMinutes([])).toBe(0)
    expect(circularSdMinutes([480])).toBe(0)
  })

  it('reflète la dispersion loin de minuit (~30 min pour 09:00/10:00)', () => {
    // SD de population de {540, 600} = 30
    expect(circularSdMinutes([540, 600])).toBe(30)
  })

  it('gère le passage par minuit : 23:50 et 00:10 sont proches (~10 min, pas ~720)', () => {
    const sd = circularSdMinutes([1430, 10]) // 23:50 et 00:10
    expect(sd).toBeLessThan(20)
    expect(sd).toBeGreaterThan(0)
  })
})

describe('computeAnchorRegularity', () => {
  const entries = [
    { values: { wake_time: '07:00', bedtime: '23:50' } },
    { values: { wake_time: '07:30', bedtime: '00:10' } },
    { values: { wake_time: '', bedtime: '23:40' } }, // wake non renseigné ce jour
  ]

  it('calcule un écart-type brut par ancre renseignée ≥ 2 fois', () => {
    const result = computeAnchorRegularity(entries, ['wake_time', 'bedtime', 'light'])
    const wake = result.find(r => r.key === 'wake_time')
    const bed = result.find(r => r.key === 'bedtime')

    expect(wake).toEqual({ key: 'wake_time', count: 2, sdMinutes: 15 }) // SD{420,450}=15
    expect(bed?.count).toBe(3)
    expect(bed?.sdMinutes).toBeLessThan(30) // proche malgré le passage par minuit
  })

  it('exclut les ancres renseignées moins de 2 fois (ex. light jamais saisi)', () => {
    const result = computeAnchorRegularity(entries, ['wake_time', 'bedtime', 'light'])
    expect(result.find(r => r.key === 'light')).toBeUndefined()
  })

  it('renvoie [] si aucune entrée', () => {
    expect(computeAnchorRegularity([], ['wake_time'])).toEqual([])
  })
})
