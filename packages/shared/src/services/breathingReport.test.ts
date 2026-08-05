import { describe, it, expect } from 'vitest'
import {
  periodStart, filterSessions, summarize, countFeelings, momentOfDay, countMoments,
  toCsvRows, buildCsv, type BreathingSessionRow,
} from './breathingReport'

const TODAY = '2026-08-05'

const session = (over: Partial<BreathingSessionRow> = {}): BreathingSessionRow => ({
  startedAt: '2026-08-05T08:00:00',
  techniqueKey: 'coherence_cardiaque',
  durationSeconds: 300,
  plannedDurationSeconds: 300,
  cyclesCompleted: 30,
  completed: true,
  feeling: null,
  ...over,
})

describe('periodStart', () => {
  it('borne les 30 derniers jours, aujourd’hui inclus', () => {
    expect(periodStart('30d', TODAY)).toBe('2026-07-07')
  })

  it('ne borne pas « Tout »', () => {
    expect(periodStart('all', TODAY)).toBeNull()
  })
})

describe('filterSessions', () => {
  const sessions = [
    session({ startedAt: '2026-08-05T08:00:00' }),
    session({ startedAt: '2026-06-01T08:00:00' }),
    session({ startedAt: '2026-08-04T08:00:00', techniqueKey: 'carree' }),
  ]

  it('écarte les sessions hors période', () => {
    expect(filterSessions(sessions, '30d', TODAY, null)).toHaveLength(2)
  })

  it('garde tout sur « Tout »', () => {
    expect(filterSessions(sessions, 'all', TODAY, null)).toHaveLength(3)
  })

  it('filtre par technique', () => {
    const filtered = filterSessions(sessions, 'all', TODAY, 'carree')
    expect(filtered.map(s => s.techniqueKey)).toEqual(['carree'])
  })

  it('rend les plus récentes d’abord', () => {
    const filtered = filterSessions(sessions, 'all', TODAY, null)
    expect(filtered[0].startedAt).toBe('2026-08-05T08:00:00')
    expect(filtered[2].startedAt).toBe('2026-06-01T08:00:00')
  })

  it('ne mute pas la liste reçue', () => {
    const input = [...sessions]
    filterSessions(input, 'all', TODAY, null)
    expect(input[0].startedAt).toBe('2026-08-05T08:00:00')
  })
})

describe('summarize', () => {
  it('compte les sessions et moyenne les durées', () => {
    const result = summarize([
      session({ durationSeconds: 300 }),
      session({ durationSeconds: 100, startedAt: '2026-08-04T08:00:00' }),
    ], 30)
    expect(result.sessions).toBe(2)
    expect(result.averageDurationSeconds).toBe(200)
  })

  it('compte les sessions menées au bout, interruptions comprises dans le total', () => {
    const result = summarize([
      session({ completed: true }),
      session({ completed: false, startedAt: '2026-08-04T08:00:00' }),
    ], 30)
    expect(result.completed).toBe(1)
    expect(result.sessions).toBe(2)
  })

  it('compte les jours distincts, pas les sessions', () => {
    const result = summarize([
      session({ startedAt: '2026-08-05T08:00:00' }),
      session({ startedAt: '2026-08-05T20:00:00' }),
    ], 30)
    expect(result.practiceDays).toBe(1)
  })

  it('rapporte les jours de pratique à une semaine', () => {
    // 6 jours distincts sur 30 jours observés → 6 / (30/7) = 1,4
    const days = ['01', '02', '03', '04', '05', '06']
    const result = summarize(days.map(d => session({ startedAt: `2026-08-${d}T08:00:00` })), 30)
    expect(result.practiceDaysPerWeek).toBe(1.4)
  })

  it('mesure l’étendue réelle quand la fenêtre n’est pas bornée', () => {
    const result = summarize([
      session({ startedAt: '2026-08-01T08:00:00' }),
      session({ startedAt: '2026-08-14T08:00:00' }),
    ], null)
    // 2 jours sur 14 observés → 1 par semaine
    expect(result.practiceDaysPerWeek).toBe(1)
  })

  it('ne produit pas de rythme absurde sur une fenêtre plus courte qu’une semaine', () => {
    const result = summarize([session()], 2)
    expect(result.practiceDaysPerWeek).toBe(1)
  })

  it('rend des zéros sans session, sans diviser par zéro', () => {
    expect(summarize([], 30)).toEqual({
      sessions: 0, averageDurationSeconds: 0, completed: 0, practiceDays: 0, practiceDaysPerWeek: 0,
    })
  })
})

describe('countFeelings', () => {
  it('compte chaque ressenti, et les sessions sans ressenti', () => {
    const counts = countFeelings([
      session({ feeling: 'calmer' }),
      session({ feeling: 'calmer' }),
      session({ feeling: 'tenser' }),
      session({ feeling: null }),
    ], ['coherence_cardiaque'])
    expect(counts[0]).toEqual({
      techniqueKey: 'coherence_cardiaque', calmer: 2, same: 0, tenser: 1, unanswered: 1, total: 4,
    })
  })

  it('sépare les techniques', () => {
    const counts = countFeelings([
      session({ techniqueKey: 'a', feeling: 'calmer' }),
      session({ techniqueKey: 'b', feeling: 'tenser' }),
    ], ['a', 'b'])
    expect(counts[0].calmer).toBe(1)
    expect(counts[1].tenser).toBe(1)
  })

  it('garde une technique sans session, à zéro', () => {
    const counts = countFeelings([], ['a'])
    expect(counts[0].total).toBe(0)
  })

  it('respecte l’ordre des techniques fourni', () => {
    const counts = countFeelings([], ['b', 'a'])
    expect(counts.map(c => c.techniqueKey)).toEqual(['b', 'a'])
  })
})

describe('momentOfDay', () => {
  it('classe le matin de 5h à 12h', () => {
    expect(momentOfDay('2026-08-05T05:00:00')).toBe('morning')
    expect(momentOfDay('2026-08-05T11:59:00')).toBe('morning')
  })

  it('classe la journée de 12h à 19h', () => {
    expect(momentOfDay('2026-08-05T12:00:00')).toBe('day')
    expect(momentOfDay('2026-08-05T18:59:00')).toBe('day')
  })

  it('classe le soir de 19h à 5h, minuit compris', () => {
    expect(momentOfDay('2026-08-05T19:00:00')).toBe('evening')
    expect(momentOfDay('2026-08-05T23:30:00')).toBe('evening')
    expect(momentOfDay('2026-08-05T00:30:00')).toBe('evening')
    expect(momentOfDay('2026-08-05T04:59:00')).toBe('evening')
  })
})

describe('countMoments', () => {
  it('compte les trois moments', () => {
    expect(countMoments([
      session({ startedAt: '2026-08-05T08:00:00' }),
      session({ startedAt: '2026-08-05T14:00:00' }),
      session({ startedAt: '2026-08-05T21:00:00' }),
      session({ startedAt: '2026-08-05T22:00:00' }),
    ])).toEqual({ morning: 1, day: 1, evening: 2 })
  })

  it('rend des zéros sans session', () => {
    expect(countMoments([])).toEqual({ morning: 0, day: 0, evening: 0 })
  })
})

describe('export CSV', () => {
  it('sort les valeurs brutes, sans colonne calculée', () => {
    const rows = toCsvRows([session({
      startedAt: '2026-08-05T08:30:00', durationSeconds: 300,
      plannedDurationSeconds: 600, cyclesCompleted: 30, completed: false, feeling: 'calmer',
    })])
    expect(rows[0]).toEqual(['2026-08-05', '08:30', 'coherence_cardiaque', '300', '600', '30', '0', 'calmer'])
  })

  it('laisse un ressenti absent vide, sans valeur de remplacement', () => {
    expect(toCsvRows([session({ feeling: null })])[0][7]).toBe('')
  })

  it('écrit un en-tête puis une ligne par session', () => {
    const csv = buildCsv([session(), session({ startedAt: '2026-08-04T08:00:00' })])
    expect(csv.split('\n')).toHaveLength(3)
    expect(csv.split('\n')[0]).toContain('technique')
  })

  it('échappe une valeur contenant une virgule', () => {
    const csv = buildCsv([session({ techniqueKey: 'a,b' })])
    expect(csv).toContain('"a,b"')
  })

  it('rend seulement l’en-tête sans session', () => {
    expect(buildCsv([]).split('\n')).toHaveLength(1)
  })
})
