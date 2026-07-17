import { describe, it, expect } from 'vitest'
import { aggregateByCadence, computeGapSegments, type AggregatedPoint, type RawDatedPoint } from './chartAggregation'

// Ancre « now » fixe pour des fenêtres déterministes (mardi 14 juillet 2026, midi local).
const NOW = new Date(2026, 6, 14, 12, 0, 0).getTime()
const at = (y: number, m: number, d: number, v: number | null): RawDatedPoint => ({
  date: new Date(y, m, d, 12, 0, 0).toISOString(), value: v,
})

describe('aggregateByCadence — hebdomadaire', () => {
  it('moyenne les saisies d’une même semaine et conserve n', () => {
    // Deux saisies dans la semaine du lundi 6 juillet 2026.
    const points = [at(2026, 6, 6, 4), at(2026, 6, 8, 8)]
    const series = aggregateByCadence(points, 'weekly', 14, NOW)
    const week = series.find(p => p.date === '2026-07-06')
    expect(week).toBeDefined()
    expect(week?.value).toBe(6) // (4+8)/2
    expect(week?.n).toBe(2)
  })

  it('produit une série continue d’unités, unité vide → value null / n 0', () => {
    const series = aggregateByCadence([at(2026, 6, 6, 5)], 'weekly', 21, NOW)
    // Chaque unité commence un lundi.
    expect(series.every(p => new Date(p.date + 'T12:00:00').getDay() === 1)).toBe(true)
    const empty = series.filter(p => p.value === null)
    expect(empty.length).toBeGreaterThan(0)
    expect(empty.every(p => p.n === 0)).toBe(true)
  })

  it('ignore les points hors fenêtre', () => {
    const series = aggregateByCadence([at(2026, 0, 1, 9)], 'weekly', 14, NOW)
    expect(series.every(p => p.value === null)).toBe(true)
  })
})

describe('aggregateByCadence — mensuelle', () => {
  it('agrège par mois calendaire', () => {
    const points = [at(2026, 5, 3, 6), at(2026, 5, 20, 8), at(2026, 6, 2, 4)]
    const series = aggregateByCadence(points, 'monthly', 120, NOW)
    expect(series.find(p => p.date === '2026-06-01')?.value).toBe(7) // juin (mois 5) : (6+8)/2
    expect(series.find(p => p.date === '2026-07-01')?.value).toBe(4) // juillet
  })
})

describe('computeGapSegments', () => {
  const mk = (rows: [string, number | null][]): AggregatedPoint[] =>
    rows.map(([date, value]) => ({ date, value, n: value == null ? 0 : 1 }))

  it('un trou d’une unité → pont (bridge), pas de bande', () => {
    const series = mk([['w1', 5], ['w2', null], ['w3', 7]])
    const { bridges, bands } = computeGapSegments(series)
    expect(bridges).toEqual([{ from: 'w1', to: 'w3' }])
    expect(bands).toEqual([])
  })

  it('deux unités vides ou + → bande (coupure), pas de pont', () => {
    const series = mk([['w1', 5], ['w2', null], ['w3', null], ['w4', 7]])
    const { bridges, bands } = computeGapSegments(series)
    expect(bridges).toEqual([])
    expect(bands).toEqual([{ from: 'w2', to: 'w3' }])
  })

  it('ignore les vides de tête et de queue', () => {
    const series = mk([['w0', null], ['w1', 5], ['w2', 6], ['w3', null]])
    expect(computeGapSegments(series)).toEqual({ bridges: [], bands: [] })
  })

  it('série < 2 points renseignés → aucun segment', () => {
    expect(computeGapSegments(mk([['w1', null], ['w2', 5]]))).toEqual({ bridges: [], bands: [] })
  })
})
