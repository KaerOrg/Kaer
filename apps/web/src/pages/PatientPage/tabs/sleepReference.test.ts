import type { SleepPoint } from '@services/engagementService'
import { referenceOffsetDays, buildReferenceWindow } from './sleepReference'

function pt(date: string, efficiency: number): SleepPoint {
  return {
    date, efficiency, total_sleep_min: 400, onset_min: 10, waso_min: 10, nap_min: 0,
    quality: 3, in_bed_time: null, bedtime: null, wake_time: null, out_of_bed_time: null, nightmares: false,
  }
}

// « Maintenant » figé au 2026-04-01T12:00 pour des fenêtres déterministes.
const NOW = new Date('2026-04-01T12:00:00Z').getTime()

describe('sleepReference', () => {
  it('referenceOffsetDays : période précédente = durée, année précédente = 365', () => {
    expect(referenceOffsetDays(90, 'previous')).toBe(90)
    expect(referenceOffsetDays(90, 'last_year')).toBe(365)
    expect(referenceOffsetDays(180, 'previous')).toBe(180)
  })

  it('previous : extrait la fenêtre équivalente précédente et la re-date sur l’axe courant', () => {
    const main = pt('2026-03-15', 80)      // dans la fenêtre courante [~01-02, 04-01]
    const prev = pt('2025-12-20', 70)      // dans la fenêtre précédente [~10-03, 01-02]
    const tooOld = pt('2025-09-01', 60)    // hors des deux fenêtres
    const ref = buildReferenceWindow([main, prev, tooOld], 90, 'previous', NOW)
    expect(ref).toHaveLength(1)
    // 2025-12-20 décalé de +90 j → aligné sur mars 2026
    expect(ref[0].date).toBe('2026-03-20')
    expect(ref[0].efficiency).toBe(70)
  })

  it('last_year : même fenêtre un an plus tôt, re-datée +365 j', () => {
    const lastYear = pt('2025-03-15', 65)  // ~ même position, un an avant
    const ref = buildReferenceWindow([lastYear], 90, 'last_year', NOW)
    expect(ref).toHaveLength(1)
    expect(ref[0].date).toBe('2026-03-15')
    expect(ref[0].efficiency).toBe(65)
  })

  it('exclut les nuits hors de la fenêtre de référence', () => {
    const current = pt('2026-03-15', 80)   // fenêtre courante, pas la référence
    expect(buildReferenceWindow([current], 90, 'previous', NOW)).toEqual([])
  })
})
