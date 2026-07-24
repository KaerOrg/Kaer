import { describe, it, expect } from 'vitest'
import {
  clampInt,
  splitMinutes,
  joinMinutes,
  minutesToHHMM,
  hhmmToMinutes,
  pad2,
  pointerToMinutes,
  minutesToTurn,
  markerPosition,
  MINUTES_PER_DAY,
} from './time'

describe('time helpers', () => {
  it('clampInt borne et tronque', () => {
    expect(clampInt(5, 0, 23)).toBe(5)
    expect(clampInt(-3, 0, 23)).toBe(0)
    expect(clampInt(99, 0, 23)).toBe(23)
    expect(clampInt(9.8, 0, 23)).toBe(9)
    expect(clampInt(Number.NaN, 0, 59)).toBe(0)
  })

  it('splitMinutes décompose et enroule modulo 24 h', () => {
    expect(splitMinutes(0)).toEqual({ hours: 0, minutes: 0 })
    expect(splitMinutes(555)).toEqual({ hours: 9, minutes: 15 })
    expect(splitMinutes(MINUTES_PER_DAY)).toEqual({ hours: 0, minutes: 0 })
    expect(splitMinutes(-15)).toEqual({ hours: 23, minutes: 45 })
  })

  it('joinMinutes borne chaque part', () => {
    expect(joinMinutes(9, 15)).toBe(555)
    expect(joinMinutes(30, 90)).toBe(23 * 60 + 59)
    expect(joinMinutes(-1, -1)).toBe(0)
  })

  it('minutesToHHMM / hhmmToMinutes sont réciproques', () => {
    expect(minutesToHHMM(555)).toBe('09:15')
    expect(minutesToHHMM(0)).toBe('00:00')
    expect(minutesToHHMM(23 * 60 + 5)).toBe('23:05')
    expect(hhmmToMinutes('09:15')).toBe(555)
    expect(hhmmToMinutes('23:05')).toBe(1385)
    expect(hhmmToMinutes('bad')).toBe(0)
  })

  it('pad2 complète à deux chiffres', () => {
    expect(pad2(9)).toBe('09')
    expect(pad2(15)).toBe('15')
    expect(pad2(0)).toBe('00')
  })

  it('minutesToTurn donne la fraction de tour', () => {
    expect(minutesToTurn(0)).toBe(0)
    expect(minutesToTurn(MINUTES_PER_DAY / 2)).toBeCloseTo(0.5)
    expect(minutesToTurn(555)).toBeCloseTo(0.385, 3)
  })

  it('markerPosition place le repère (0 h en haut, sens horaire)', () => {
    const r = 100
    // Minuit : en haut (x = r, y = 0).
    let p = markerPosition(0, r)
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(0)
    // 6 h = quart de tour : à droite (x = 2r, y = r).
    p = markerPosition(6 * 60, r)
    expect(p.x).toBeCloseTo(200)
    expect(p.y).toBeCloseTo(100)
    // 12 h = demi-tour : en bas (x = r, y = 2r).
    p = markerPosition(12 * 60, r)
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(200)
  })

  describe('pointerToMinutes', () => {
    const step = 15
    it('haut = minuit', () => {
      expect(pointerToMinutes(0, -100, step)).toBe(0)
    })
    it('droite = 6 h', () => {
      expect(pointerToMinutes(100, 0, step)).toBe(6 * 60)
    })
    it('bas = 12 h', () => {
      expect(pointerToMinutes(0, 100, step)).toBe(12 * 60)
    })
    it('gauche = 18 h', () => {
      expect(pointerToMinutes(-100, 0, step)).toBe(18 * 60)
    })
    it('aimante au pas de 15 min', () => {
      // Angle légèrement après 6 h → arrondi au quart d'heure le plus proche.
      const m = pointerToMinutes(100, 8, step)
      expect(m % step).toBe(0)
    })
  })
})
