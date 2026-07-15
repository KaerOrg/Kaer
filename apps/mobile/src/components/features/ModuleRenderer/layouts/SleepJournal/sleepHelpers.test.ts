import type { SleepEntry } from '../../../../../lib/database'
import {
  WEEKDAYS_SHORT,
  yesterdayDateStr,
  lastNDays,
  toYearMonth,
  daysInMonth,
  firstWeekday,
  sleepMinutes,
  formatMinutes,
  minutesToHhmmHint,
  computeSleepWindow,
  entryEfficiency,
  metricValue,
  rangeStartIso,
  daysBetweenIso,
  buildNightlyPoints,
  buildNightlyLabels,
  buildWeeklyAverages,
} from './sleepHelpers'

// Entrée SQLite complète — surchargée champ par champ dans chaque test.
function makeEntry(overrides: Partial<SleepEntry>): SleepEntry {
  return {
    id: 'e1',
    date: '2026-02-01',
    in_bed_time: null,
    bedtime: null,
    wake_time: null,
    out_of_bed_time: null,
    sleep_onset_minutes: 0,
    awakenings: 0,
    awakenings_duration_minutes: 0,
    quality: null,
    restedness: null,
    nap_minutes: 0,
    sleep_aid: 0,
    nightmares: 0,
    notes: null,
    created_at: '2026-02-01T08:00:00Z',
    ...overrides,
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

describe('sleepHelpers — fenêtres de dates', () => {
  it('yesterdayDateStr renvoie une date ISO YYYY-MM-DD', () => {
    expect(yesterdayDateStr()).toMatch(DATE_RE)
  })

  it('lastNDays renvoie n dates, hier en premier, antéchronologiques', () => {
    const days = lastNDays(3)
    expect(days).toHaveLength(3)
    days.forEach(d => expect(d).toMatch(DATE_RE))
    // Hier (i=1) en premier, puis plus anciennes
    expect(days[0]).toBe(yesterdayDateStr())
    expect(days[0] > days[1]).toBe(true)
    expect(days[1] > days[2]).toBe(true)
  })

  it('lastNDays(0) renvoie un tableau vide', () => {
    expect(lastNDays(0)).toEqual([])
  })
})

describe('sleepHelpers — calendrier mensuel', () => {
  it('toYearMonth pad le mois sur 2 chiffres', () => {
    expect(toYearMonth(2026, 6)).toBe('2026-06')
    expect(toYearMonth(2026, 12)).toBe('2026-12')
  })

  it('daysInMonth gère les mois et années bissextiles', () => {
    expect(daysInMonth(2024, 1)).toBe(31)
    expect(daysInMonth(2024, 2)).toBe(29) // 2024 bissextile
    expect(daysInMonth(2023, 2)).toBe(28)
    expect(daysInMonth(2026, 4)).toBe(30)
  })

  it('firstWeekday renvoie l’index lundi=0 … dimanche=6 du 1er du mois', () => {
    expect(firstWeekday(2024, 1)).toBe(0) // 1er janv. 2024 = lundi
    expect(firstWeekday(2024, 2)).toBe(3) // 1er févr. 2024 = jeudi
  })

  it('WEEKDAYS_SHORT commence par lundi et a 7 entrées', () => {
    expect(WEEKDAYS_SHORT).toHaveLength(7)
    expect(WEEKDAYS_SHORT[0]).toBe('L')
    expect(WEEKDAYS_SHORT[6]).toBe('D')
  })
})

describe('sleepHelpers — sleepMinutes', () => {
  it('calcule la fenêtre de sommeil avec passage à minuit', () => {
    expect(sleepMinutes(makeEntry({ bedtime: '23:00', wake_time: '07:00' }))).toBe(480)
  })

  it('soustrait la latence d’endormissement', () => {
    expect(sleepMinutes(makeEntry({ bedtime: '23:00', wake_time: '07:00', sleep_onset_minutes: 30 }))).toBe(450)
  })

  it('retourne null si bedtime ou wake_time manque', () => {
    expect(sleepMinutes(makeEntry({ bedtime: null, wake_time: '07:00' }))).toBeNull()
    expect(sleepMinutes(makeEntry({ bedtime: '23:00', wake_time: null }))).toBeNull()
  })
})

describe('sleepHelpers — formatage de durées', () => {
  it('formatMinutes rend XhYY', () => {
    expect(formatMinutes(0)).toBe('0h00')
    expect(formatMinutes(60)).toBe('1h00')
    expect(formatMinutes(485)).toBe('8h05')
  })

  it('minutesToHhmmHint renvoie un appoint « = XhYY » ou null', () => {
    expect(minutesToHhmmHint(0)).toBeNull()
    expect(minutesToHhmmHint(45)).toBeNull() // < 1 h
    expect(minutesToHhmmHint(60)).toBe('= 1h00')
    expect(minutesToHhmmHint(90)).toBe('= 1h30')
    expect(minutesToHhmmHint(125)).toBe('= 2h05')
  })
})

describe('sleepHelpers — computeSleepWindow (barre fenêtre 18 h → midi)', () => {
  it('positionne le segment coucher→lever dans la fenêtre de référence', () => {
    // 23:00 = 300 min après 18 h ; 07:00 = 780 min. Fenêtre = 1080 min.
    const geo = computeSleepWindow('23:00', '07:00')
    expect(geo).not.toBeNull()
    expect(geo?.leftPct).toBeCloseTo((300 / 1080) * 100, 4)
    expect(geo?.widthPct).toBeCloseTo((480 / 1080) * 100, 4)
  })

  it('retourne null si un horaire manque', () => {
    expect(computeSleepWindow(null, '07:00')).toBeNull()
    expect(computeSleepWindow('23:00', null)).toBeNull()
  })

  it('retourne null si la largeur est nulle (horaires identiques)', () => {
    expect(computeSleepWindow('23:00', '23:00')).toBeNull()
  })

  it('borne le segment à la fenêtre (horaires hors 18 h→midi)', () => {
    // 13:00 (offset 1140 → clamp 1080) au lever après un coucher à 12:00 (clamp 1080) → largeur nulle.
    expect(computeSleepWindow('12:00', '13:00')).toBeNull()
  })
})

describe('sleepHelpers — métriques brutes', () => {
  it('metricValue(duration) rend la durée en heures (1 décimale)', () => {
    expect(metricValue(makeEntry({ bedtime: '23:00', wake_time: '07:00' }), 'duration')).toBe(8)
    expect(metricValue(makeEntry({ bedtime: '23:00', wake_time: '06:30' }), 'duration')).toBe(7.5)
  })

  it('metricValue(duration) null si horaires manquants', () => {
    expect(metricValue(makeEntry({ bedtime: null }), 'duration')).toBeNull()
  })

  it('entryEfficiency = TST / TPL en %', () => {
    // fenêtre 23:00→07:00 = 480 ; TPL 22:45→07:15 = 510 → 480/510 ≈ 94 %
    const e = makeEntry({ bedtime: '23:00', wake_time: '07:00', in_bed_time: '22:45', out_of_bed_time: '07:15' })
    expect(entryEfficiency(e)).toBe(94)
    expect(metricValue(e, 'efficiency')).toBe(94)
  })

  it('entryEfficiency null si horaires insuffisants', () => {
    expect(entryEfficiency(makeEntry({ bedtime: null }))).toBeNull()
  })
})

describe('sleepHelpers — plages temporelles', () => {
  it('rangeStartIso couvre une fenêtre de N jours se terminant à endIso', () => {
    expect(rangeStartIso('1M', '2026-03-31')).toBe('2026-03-02') // 30 jours inclusifs
    expect(daysBetweenIso(rangeStartIso('1M', '2026-03-31'), '2026-03-31')).toBe(29)
    expect(daysBetweenIso(rangeStartIso('3M', '2026-03-31'), '2026-03-31')).toBe(89)
    expect(daysBetweenIso(rangeStartIso('6M', '2026-03-31'), '2026-03-31')).toBe(179)
  })

  it('daysBetweenIso gère le passage de mois sans décalage de fuseau', () => {
    expect(daysBetweenIso('2026-01-30', '2026-02-02')).toBe(3)
  })
})

describe('sleepHelpers — agrégations Évolution', () => {
  it('buildNightlyPoints : un point par nuit, gap sur les nuits sans donnée', () => {
    const entries = [makeEntry({ date: '2026-03-02', bedtime: '23:00', wake_time: '07:00' })]
    const points = buildNightlyPoints(entries, 'duration', '2026-03-01', '2026-03-03')
    expect(points).toHaveLength(3)
    expect(points[0]).toEqual({ value: 0, hasValue: false })
    expect(points[1]).toEqual({ value: 8, hasValue: true })
    expect(points[2]).toEqual({ value: 0, hasValue: false })
  })

  it('buildNightlyLabels : une étiquette au changement de mois', () => {
    const labels = buildNightlyLabels('2026-01-30', '2026-02-02', 'fr')
    expect(labels).toHaveLength(2)
    expect(labels[0].index).toBe(0)
    expect(labels[1].index).toBe(2) // 2026-02-01 = 3e jour (index 2)
    labels.forEach(l => expect(l.label.length).toBeGreaterThan(0))
  })

  it('buildWeeklyAverages : moyenne brute par semaine, étiquettes S1…Sn', () => {
    const entries = [
      makeEntry({ date: '2026-03-03', bedtime: '23:00', wake_time: '07:00' }), // 8 h
      makeEntry({ date: '2026-03-04', bedtime: '23:00', wake_time: '05:00' }), // 6 h
    ]
    const { points, labels } = buildWeeklyAverages(entries, 'duration', '2026-03-02', '2026-03-08', 'S')
    expect(labels[0].label).toBe('S1')
    const filled = points.find(p => p.hasValue)
    expect(filled?.value).toBe(7) // (8 + 6) / 2
  })
})
