import type { SleepPoint } from '@services/engagementService'
import { SLEEP_METRICS, niceMax, metricDomain } from './sleepMetrics'

function makePoint(over: Partial<SleepPoint>): SleepPoint {
  return {
    date: '2026-03-01', efficiency: null, total_sleep_min: null, onset_min: 0, waso_min: 0,
    nap_min: 0, quality: null, in_bed_time: null, bedtime: null, wake_time: null,
    out_of_bed_time: null, nightmares: false, ...over,
  }
}

const byKey = (k: string) => SLEEP_METRICS.find(m => m.key === k)!

describe('sleepMetrics', () => {
  it('les 6 métriques attendues, cauchemars marqués sur efficacité/durée seulement', () => {
    expect(SLEEP_METRICS.map(m => m.key)).toEqual(['efficiency', 'duration', 'onset', 'waso', 'naps', 'quality'])
    expect(byKey('efficiency').markNightmares).toBe(true)
    expect(byKey('duration').markNightmares).toBe(true)
    expect(byKey('onset').markNightmares).toBe(false)
  })

  it('extracteur durée : minutes → heures (1 décimale)', () => {
    expect(byKey('duration').value(makePoint({ total_sleep_min: 450 }))).toBe(7.5)
    expect(byKey('duration').value(makePoint({ total_sleep_min: null }))).toBeNull()
  })

  it('extracteurs bruts efficacité / latence / réveils / siestes / qualité', () => {
    expect(byKey('efficiency').value(makePoint({ efficiency: 88 }))).toBe(88)
    expect(byKey('onset').value(makePoint({ onset_min: 25 }))).toBe(25)
    expect(byKey('waso').value(makePoint({ waso_min: 40 }))).toBe(40)
    expect(byKey('naps').value(makePoint({ nap_min: 20 }))).toBe(20)
    expect(byKey('quality').value(makePoint({ quality: 3 }))).toBe(3)
  })

  it('niceMax : multiple de step au-dessus du max, avec plancher', () => {
    expect(niceMax([])).toBe(60)
    expect(niceMax([10, 25])).toBe(60)      // plancher 60
    expect(niceMax([70, 100], 60, 15)).toBe(105)
  })

  it('metricDomain : fixe si défini, sinon borné sur les données', () => {
    expect(metricDomain(byKey('efficiency'), [])).toEqual([0, 100])
    const points = [makePoint({ onset_min: 90 }), makePoint({ onset_min: 30 })]
    expect(metricDomain(byKey('onset'), points)).toEqual([0, 90])
  })
})
