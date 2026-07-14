import { describe, it, expect } from 'vitest'
import { buildRhythmogram, buildRangeStats, minutesToHourLabel, minutesToClock } from './rhythmogram'

const KEYS = ['wake_time', 'bedtime']

describe('buildRhythmogram', () => {
  it('place les horaires sur le bon jour et ne garde que le mois demandé', () => {
    const entries = [
      { date: '2026-06-01', values: { wake_time: '07:00', bedtime: '23:00' } },
      { date: '2026-06-03', values: { wake_time: '07:30', bedtime: '23:30' } },
      { date: '2026-05-30', values: { wake_time: '06:00' } }, // autre mois → ignoré
    ]
    const { data, loggedDays } = buildRhythmogram(entries, KEYS, 2026, 6)

    expect(data).toHaveLength(30) // juin
    expect(data[0]).toMatchObject({ day: 1, wake_time: 420, bedtime: 1380 })
    expect(data[1]).toMatchObject({ day: 2, wake_time: null, bedtime: null })
    expect(data[2]).toMatchObject({ day: 3, wake_time: 450, bedtime: 1410 })
    expect(loggedDays).toBe(2)
  })

  it('déroule les horaires autour de minuit (coucher 23:50 / 00:10 restent proches)', () => {
    const entries = [
      { date: '2026-06-01', values: { bedtime: '23:50' } },
      { date: '2026-06-02', values: { bedtime: '00:10' } },
    ]
    const { data } = buildRhythmogram(entries, ['bedtime'], 2026, 6)
    const d1 = data[0].bedtime as number
    const d2 = data[1].bedtime as number
    // Continuité : les deux points restent proches (pas de saut de ~24 h)…
    expect(Math.abs(d2 - d1)).toBeLessThan(60)
    // …et l'heure d'horloge est préservée après déroulage.
    expect(minutesToClock(d1)).toBe('23:50')
    expect(minutesToClock(d2)).toBe('00:10')
  })

  it('calcule un écart-type circulaire brut par repère', () => {
    const entries = [
      { date: '2026-06-01', values: { wake_time: '07:00' } },
      { date: '2026-06-02', values: { wake_time: '07:30' } },
    ]
    const { anchors } = buildRhythmogram(entries, ['wake_time'], 2026, 6)
    const wake = anchors.find(a => a.key === 'wake_time')
    expect(wake?.count).toBe(2)
    expect(wake?.sdMinutes).toBe(15) // SD{420,450}
  })

  it('repère les débuts de semaine (lundis) du mois', () => {
    // Juin 2026 : le 1er est un lundi.
    const { weekStarts } = buildRhythmogram([], KEYS, 2026, 6)
    expect(weekStarts).toEqual([1, 8, 15, 22, 29])
  })
})

describe('formatters', () => {
  it('minutesToHourLabel', () => {
    expect(minutesToHourLabel(420)).toBe('7h')
    expect(minutesToHourLabel(1380)).toBe('23h')
    expect(minutesToHourLabel(1470)).toBe('1h') // 24:30 → 0h30 arrondi → 1h
  })
  it('minutesToClock', () => {
    expect(minutesToClock(450)).toBe('07:30')
    expect(minutesToClock(1450)).toBe('00:10') // déroulé → ramené dans la journée
  })
})

describe('buildRangeStats', () => {
  it('calcule min / médiane / max et reprend sd + count par repère', () => {
    const entries = [
      { date: '2026-06-01', values: { wake_time: '07:00' } },
      { date: '2026-06-02', values: { wake_time: '08:00' } },
      { date: '2026-06-03', values: { wake_time: '07:30' } },
    ]
    const result = buildRhythmogram(entries, ['wake_time', 'bedtime'], 2026, 6)
    const stats = buildRangeStats(result, ['wake_time', 'bedtime'])
    const wake = stats.find(s => s.key === 'wake_time')!
    expect(wake.min).toBe(420)   // 07:00
    expect(wake.median).toBe(450) // 07:30
    expect(wake.max).toBe(480)   // 08:00
    expect(wake.count).toBe(3)
    expect(wake.sdMinutes).toBe(result.anchors.find(a => a.key === 'wake_time')!.sdMinutes)
  })

  it('médiane = moyenne des deux centraux pour un nombre pair de valeurs', () => {
    const entries = [
      { date: '2026-06-01', values: { wake_time: '07:00' } },
      { date: '2026-06-02', values: { wake_time: '08:00' } },
    ]
    const result = buildRhythmogram(entries, ['wake_time'], 2026, 6)
    expect(buildRangeStats(result, ['wake_time'])[0].median).toBe(450) // (420+480)/2
  })

  it('renvoie min/median/max null et count 0 pour un repère jamais saisi', () => {
    const result = buildRhythmogram([], ['bedtime'], 2026, 6)
    expect(buildRangeStats(result, ['bedtime'])[0]).toMatchObject({ min: null, median: null, max: null, count: 0, sdMinutes: 0 })
  })
})
