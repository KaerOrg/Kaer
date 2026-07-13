import {
  firstWeekday,
  daysInMonth,
  toISODate,
  timeToFraction,
  countFilledAnchors,
  buildEntriesByDate,
  buildSpread,
  type AnchorEntry,
} from './chronoMonthUtils'
import { buildRhythmogram, type RhythmEntry } from '@kaer/shared'

describe('chronoMonthUtils', () => {
  describe('firstWeekday', () => {
    it('renvoie 0 pour un mois qui démarre un lundi', () => {
      // 1er février 2027 = lundi
      expect(firstWeekday(2027, 2)).toBe(0)
    })

    it('renvoie 6 pour un mois qui démarre un dimanche', () => {
      // 1er mars 2026 = dimanche
      expect(firstWeekday(2026, 3)).toBe(6)
    })
  })

  describe('daysInMonth', () => {
    it('renvoie 31 pour janvier', () => {
      expect(daysInMonth(2026, 1)).toBe(31)
    })

    it('renvoie 28 pour février non-bissextile', () => {
      expect(daysInMonth(2026, 2)).toBe(28)
    })

    it('renvoie 29 pour février bissextile', () => {
      expect(daysInMonth(2024, 2)).toBe(29)
    })

    it('renvoie 30 pour avril', () => {
      expect(daysInMonth(2026, 4)).toBe(30)
    })
  })

  describe('toISODate', () => {
    it('format avec zéros à gauche', () => {
      expect(toISODate(2026, 5, 1)).toBe('2026-05-01')
      expect(toISODate(2026, 12, 31)).toBe('2026-12-31')
    })
  })

  describe('timeToFraction', () => {
    it('mappe 00:00 → 0', () => {
      expect(timeToFraction('00:00')).toBe(0)
    })

    it('mappe 12:00 → 0.5', () => {
      expect(timeToFraction('12:00')).toBe(0.5)
    })

    it('mappe 24:00 cap à 1', () => {
      expect(timeToFraction('23:59')).toBeCloseTo(1, 2)
    })

    it('renvoie 0 si format invalide', () => {
      expect(timeToFraction('invalide')).toBe(0)
      expect(timeToFraction('')).toBe(0)
    })
  })

  describe('countFilledAnchors', () => {
    it('compte uniquement les valeurs non-null', () => {
      const entry: AnchorEntry = {
        date: '2026-05-10',
        anchors: { wake_time: '07:30', first_meal: '08:00', bedtime: null },
      }
      expect(countFilledAnchors(entry, ['wake_time', 'first_meal', 'bedtime'])).toBe(2)
    })

    it('renvoie 0 si toutes les ancres demandées sont null', () => {
      const entry: AnchorEntry = {
        date: '2026-05-10',
        anchors: { wake_time: null, bedtime: null },
      }
      expect(countFilledAnchors(entry, ['wake_time', 'bedtime'])).toBe(0)
    })
  })

  describe('buildEntriesByDate', () => {
    it('indexe par date', () => {
      const entries: AnchorEntry[] = [
        { date: '2026-05-10', anchors: { wake_time: '07:00' } },
        { date: '2026-05-11', anchors: { bedtime: '23:00' } },
      ]
      const map = buildEntriesByDate(entries)
      expect(map.size).toBe(2)
      expect(map.get('2026-05-10')?.anchors.wake_time).toBe('07:00')
      expect(map.get('2026-05-11')?.anchors.bedtime).toBe('23:00')
    })
  })

  describe('buildSpread', () => {
    const ENTRIES: RhythmEntry[] = [
      { date: '2026-06-02', values: { wake_time: '07:00' } },
      { date: '2026-06-09', values: { wake_time: '08:00' } },
      { date: '2026-05-20', values: { wake_time: '06:00' } }, // mois précédent
    ]

    it('monthsBack=1 reproduit le sdMinutes de buildRhythmogram du mois', () => {
      const spread = buildSpread(ENTRIES, ['wake_time'], 2026, 6, 1)
      const rhythm = buildRhythmogram(ENTRIES, ['wake_time'], 2026, 6)
      const wakeSpread = spread.find(s => s.key === 'wake_time')!
      const wakeRhythm = rhythm.anchors.find(s => s.key === 'wake_time')!
      expect(wakeSpread.sdMinutes).toBe(wakeRhythm.sdMinutes)
      expect(wakeSpread.count).toBe(2) // seuls les 2 jours de juin
    })

    it('monthsBack=3 agrège la fenêtre de 3 mois', () => {
      const spread = buildSpread(ENTRIES, ['wake_time'], 2026, 6, 3)
      expect(spread.find(s => s.key === 'wake_time')!.count).toBe(3) // juin + mai inclus
    })

    it('gère le passage d’année en arrière (janvier → décembre)', () => {
      const entries: RhythmEntry[] = [{ date: '2025-12-15', values: { wake_time: '07:00' } }]
      const spread = buildSpread(entries, ['wake_time'], 2026, 1, 2)
      expect(spread.find(s => s.key === 'wake_time')!.count).toBe(1)
    })

    it('renvoie count 0 et sd 0 pour un repère jamais saisi', () => {
      const spread = buildSpread(ENTRIES, ['bedtime'], 2026, 6, 1)
      expect(spread[0]).toEqual({ key: 'bedtime', count: 0, sdMinutes: 0 })
    })
  })
})
