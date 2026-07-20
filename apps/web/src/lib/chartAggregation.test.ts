import { describe, it, expect } from 'vitest'
import { aggregateByCadence, computeGapSegments, buildCadenceTrend, spanDays, type AggregatedPoint, type RawDatedPoint } from './chartAggregation'

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

describe('buildCadenceTrend', () => {
  it('combine agrégation + segments de trous en une passe', () => {
    const points = [at(2026, 6, 6, 6), at(2026, 6, 8, 8)] // semaine du 6 juillet
    const { data, gaps } = buildCadenceTrend(points, 'weekly', 21, NOW)
    expect(data.find(p => p.date === '2026-07-06')?.value).toBe(7)
    expect(gaps).toHaveProperty('bridges')
    expect(gaps).toHaveProperty('bands')
  })
})

describe('spanDays', () => {
  it('couvre de la plus ancienne saisie à now (+ marge)', () => {
    const points = [at(2026, 5, 14, 5), at(2026, 6, 6, 8)] // plus ancienne : 14 juin
    // 14 juin midi → 14 juillet midi = 30 jours, + marge de 2.
    expect(spanDays(points, NOW)).toBe(32)
  })

  it('ignore l’ordre des points (min sur toutes les dates)', () => {
    const points = [at(2026, 6, 6, 8), at(2026, 5, 14, 5), at(2026, 6, 1, 7)]
    expect(spanDays(points, NOW)).toBe(32)
  })

  it('repli à 30 jours si aucune saisie', () => {
    expect(spanDays([], NOW)).toBe(30)
  })

  it('plancher à 30 jours pour un historique très court', () => {
    expect(spanDays([at(2026, 6, 13, 5)], NOW)).toBe(30) // 1 jour → plancher 30
  })
})
