import { describe, it, expect } from 'vitest'
import type { MoodPoint } from '@services/engagementService'
import {
  moodDay, filterMoodByDays, buildDimensionTrend, moodWindowSummary,
  dimensionStats, buildComparisonTrend,
} from './moodTrend'

const DAY = 86_400_000
const iso = (daysAgo: number, h = 12) => new Date(Date.now() - daysAgo * DAY + h * 3600_000 - 12 * 3600_000).toISOString()

describe('moodTrend.moodDay', () => {
  it('extrait le jour YYYY-MM-DD', () => {
    expect(moodDay('2026-07-03T10:00:00.000Z')).toBe('2026-07-03')
  })
})

describe('moodTrend.buildDimensionTrend', () => {
  it('un point par jour, dernière valeur numérique du jour, null si dimension absente', () => {
    const points: MoodPoint[] = [
      { date: '2026-07-01T08:00:00.000Z', humeur: 5, energie: 4 },
      { date: '2026-07-01T20:00:00.000Z', humeur: 7 }, // même jour, humeur écrase
      { date: '2026-07-03T09:00:00.000Z', energie: 6 }, // humeur absente ce jour
    ]
    const trend = buildDimensionTrend(points, 'humeur')
    expect(trend).toEqual([
      { date: '2026-07-01', value: 7 },
      { date: '2026-07-03', value: null },
    ])
  })
})

describe('moodTrend.moodWindowSummary', () => {
  it('moyenne par dimension + jours saisis sur la fenêtre', () => {
    const points: MoodPoint[] = [
      { date: iso(1), humeur: 6, energie: 4 },
      { date: iso(2), humeur: 8 },
      { date: iso(40), humeur: 2 }, // hors fenêtre 7j
    ]
    const s = moodWindowSummary(points, ['humeur', 'energie'], 7)
    expect(s.averages.humeur).toBe(7) // (6+8)/2
    expect(s.averages.energie).toBe(4)
    expect(s.daysLogged).toBe(2)
    expect(s.windowDays).toBe(7)
  })

  it('moyenne null quand aucune valeur', () => {
    const s = moodWindowSummary([], ['humeur'], 30)
    expect(s.averages.humeur).toBeNull()
    expect(s.daysLogged).toBe(0)
  })
})

describe('moodTrend.filterMoodByDays', () => {
  it('ne garde que les saisies dans la fenêtre', () => {
    const points: MoodPoint[] = [{ date: iso(2), humeur: 5 }, { date: iso(20), humeur: 5 }]
    expect(filterMoodByDays(points, 7)).toHaveLength(1)
  })
})

describe('moodTrend.dimensionStats', () => {
  it('min/max/moyenne/n sur les valeurs renseignées', () => {
    const stats = dimensionStats([
      { date: 'a', value: 4 }, { date: 'b', value: null }, { date: 'c', value: 8 }, { date: 'd', value: 6 },
    ])
    expect(stats).toEqual({ min: 4, max: 8, mean: 6, n: 3 })
  })

  it('tout null si série vide', () => {
    expect(dimensionStats([])).toEqual({ min: null, max: null, mean: null, n: 0 })
  })
})

describe('moodTrend.buildComparisonTrend', () => {
  it('re-date la fenêtre précédente vers la fenêtre courante', () => {
    // saisie à 35 jours → décalée de +30 → ~5 jours (dans la fenêtre courante)
    const points: MoodPoint[] = [{ date: iso(35), humeur: 3 }]
    const cmp = buildComparisonTrend(points, 'humeur', 30)
    expect(cmp).toHaveLength(1)
    expect(cmp[0].value).toBe(3)
    // la date décalée tombe dans les 30 derniers jours
    expect(new Date(cmp[0].date + 'T00:00:00').getTime()).toBeGreaterThan(Date.now() - 30 * DAY)
  })
})
