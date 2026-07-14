import { describe, it, expect } from 'vitest'
import { clockFraction, rangeToSegments } from './anchorRangeGeometry'

describe('clockFraction', () => {
  it('mappe minuit → 0 et midi → 0.5', () => {
    expect(clockFraction(0)).toBe(0)
    expect(clockFraction(720)).toBe(0.5)
  })
  it('ramène les minutes déroulées dans 0..1 (mod 24 h)', () => {
    expect(clockFraction(1440)).toBe(0) // minuit du lendemain
    expect(clockFraction(1470)).toBeCloseTo(30 / 1440) // 00:30 déroulé
    expect(clockFraction(-30)).toBeCloseTo(1410 / 1440) // 23:30
  })
})

describe('rangeToSegments', () => {
  it('un seul segment quand la plage ne franchit pas minuit', () => {
    expect(rangeToSegments(420, 480)).toEqual([[420 / 1440, 480 / 1440]])
  })
  it('deux segments quand la plage franchit minuit', () => {
    // 23:00 (1380) → 00:30 déroulé (1470) → lo=1380/1440, hi=30/1440, lo>hi
    const segs = rangeToSegments(1380, 1470)
    expect(segs).toHaveLength(2)
    expect(segs[0][0]).toBe(0)
    expect(segs[1][1]).toBe(1)
  })
  it('une plage ≥ 24 h couvre tout l’axe', () => {
    expect(rangeToSegments(0, 1440)).toEqual([[0, 1]])
  })
})
