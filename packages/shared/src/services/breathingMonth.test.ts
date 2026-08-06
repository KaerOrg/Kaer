import { describe, it, expect } from 'vitest'
import {
  monthsWithSessions, sessionsInMonth, buildMonthDays, previousMonth, sessionsInWeekFrom,
} from './breathingMonth'
import type { BreathingSessionRow, BreathingFeelingValue } from './breathingReport'

function session(
  startedAt: string,
  techniqueKey = 'coherence_cardiaque',
  feeling: BreathingFeelingValue | null = null,
): BreathingSessionRow {
  return {
    startedAt, techniqueKey, feeling,
    durationSeconds: 300, plannedDurationSeconds: 300, cyclesCompleted: 30, completed: true,
  }
}

describe('monthsWithSessions', () => {
  it('liste les mois distincts du plus ancien au plus recent', () => {
    expect(monthsWithSessions([
      session('2026-03-14T08:00:00'),
      session('2026-01-02T08:00:00'),
      session('2026-03-28T08:00:00'),
    ])).toEqual([{ year: 2026, month: 1 }, { year: 2026, month: 3 }])
  })

  it('ordonne aussi d une annee sur l autre', () => {
    expect(monthsWithSessions([
      session('2026-01-05T08:00:00'),
      session('2025-12-30T08:00:00'),
    ])).toEqual([{ year: 2025, month: 12 }, { year: 2026, month: 1 }])
  })

  it('ne renvoie rien sans session', () => {
    expect(monthsWithSessions([])).toEqual([])
  })
})

describe('sessionsInMonth', () => {
  it('ne garde que le mois demande', () => {
    const sessions = [session('2026-02-28T22:00:00'), session('2026-03-01T06:00:00')]
    expect(sessionsInMonth(sessions, { year: 2026, month: 3 })).toHaveLength(1)
    expect(sessionsInMonth(sessions, { year: 2026, month: 3 })[0].startedAt).toBe('2026-03-01T06:00:00')
  })
})

describe('buildMonthDays', () => {
  it('groupe les sessions par jour, du 1er au dernier', () => {
    const days = buildMonthDays([
      session('2026-03-10T19:00:00'),
      session('2026-03-04T08:00:00'),
      session('2026-03-10T07:00:00'),
    ], { year: 2026, month: 3 })
    expect(days.map(d => d.day)).toEqual([4, 10])
    expect(days[1].sessions).toBe(2)
  })

  it('ne produit aucun jour sans session', () => {
    const days = buildMonthDays([session('2026-03-04T08:00:00')], { year: 2026, month: 3 })
    expect(days).toHaveLength(1)
  })

  it('retient la technique majoritaire du jour', () => {
    const days = buildMonthDays([
      session('2026-03-04T07:00:00', 'carree'),
      session('2026-03-04T12:00:00', 'coherence_cardiaque'),
      session('2026-03-04T19:00:00', 'coherence_cardiaque'),
    ], { year: 2026, month: 3 })
    expect(days[0].techniqueKey).toBe('coherence_cardiaque')
  })

  it('tranche une egalite par la session la plus ancienne du jour', () => {
    const days = buildMonthDays([
      session('2026-03-04T19:00:00', 'carree'),
      session('2026-03-04T07:00:00', 'diaphragmatique'),
    ], { year: 2026, month: 3 })
    expect(days[0].techniqueKey).toBe('diaphragmatique')
  })

  it('porte le ressenti de la derniere session du jour', () => {
    const days = buildMonthDays([
      session('2026-03-04T07:00:00', 'carree', 'tenser'),
      session('2026-03-04T19:00:00', 'carree', 'calmer'),
    ], { year: 2026, month: 3 })
    expect(days[0].feeling).toBe('calmer')
  })

  it('garde un ressenti absent tel quel, sans valeur de repli', () => {
    const days = buildMonthDays([session('2026-03-04T07:00:00', 'carree', null)], { year: 2026, month: 3 })
    expect(days[0].feeling).toBeNull()
  })

  it('ignore les sessions des autres mois', () => {
    const days = buildMonthDays([
      session('2026-02-04T07:00:00'),
      session('2026-03-04T07:00:00'),
    ], { year: 2026, month: 3 })
    expect(days).toHaveLength(1)
    expect(days[0].date).toBe('2026-03-04')
  })
})

describe('previousMonth', () => {
  it('recule d un mois', () => {
    expect(previousMonth({ year: 2026, month: 3 })).toEqual({ year: 2026, month: 2 })
  })

  it('repasse a decembre de l annee precedente', () => {
    expect(previousMonth({ year: 2026, month: 1 })).toEqual({ year: 2025, month: 12 })
  })
})

describe('sessionsInWeekFrom', () => {
  it('compte les sessions de la semaine, bornes incluses', () => {
    const sessions = [
      session('2026-03-01T08:00:00'),
      session('2026-03-02T08:00:00'),
      session('2026-03-08T23:00:00'),
      session('2026-03-09T08:00:00'),
    ]
    expect(sessionsInWeekFrom(sessions, '2026-03-02', '2026-03-08')).toBe(2)
  })

  it('renvoie zero quand la semaine est vide', () => {
    expect(sessionsInWeekFrom([session('2026-03-01T08:00:00')], '2026-03-02', '2026-03-08')).toBe(0)
  })
})
