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
