import { describe, it, expect } from 'vitest'
import {
  buildWeekPractice,
  sessionsInWeek,
  currentStreak,
  lastSession,
  type BreathingSessionLike,
  type BreathingSessionTimed,
} from './breathingStats'

// 2026-08-05 est un mercredi ; la semaine court du lundi 2026-08-03 au dimanche 2026-08-09.
const WEDNESDAY = '2026-08-05'

const s = (...dates: string[]): BreathingSessionLike[] => dates.map(date => ({ date }))

describe('buildWeekPractice', () => {
  it('rend 7 jours du lundi au dimanche de la semaine courante', () => {
    const week = buildWeekPractice([], WEDNESDAY)
    expect(week).toHaveLength(7)
    expect(week[0].iso).toBe('2026-08-03')
    expect(week[6].iso).toBe('2026-08-09')
  })

  it('marque les jours portant au moins une session', () => {
    const week = buildWeekPractice(s('2026-08-03', '2026-08-05', '2026-08-05'), WEDNESDAY)
    expect(week.map(d => d.practiced)).toEqual([true, false, true, false, false, false, false])
  })

  it('marque le jour de référence, et lui seul', () => {
    const week = buildWeekPractice([], WEDNESDAY)
    expect(week.filter(d => d.isToday).map(d => d.iso)).toEqual([WEDNESDAY])
  })

  it('ignore les sessions hors de la semaine affichée', () => {
    const week = buildWeekPractice(s('2026-07-30', '2026-08-12'), WEDNESDAY)
    expect(week.every(d => !d.practiced)).toBe(true)
  })

  it('place le dimanche en fin de semaine (et non en tête)', () => {
    const week = buildWeekPractice(s('2026-08-09'), '2026-08-09')
    expect(week[6]).toEqual({ iso: '2026-08-09', practiced: true, isToday: true })
  })
})

describe('sessionsInWeek', () => {
  it('compte les sessions, pas les jours', () => {
    expect(sessionsInWeek(s('2026-08-05', '2026-08-05', '2026-08-06'), WEDNESDAY)).toBe(3)
  })

  it('inclut les bornes lundi et dimanche', () => {
    expect(sessionsInWeek(s('2026-08-03', '2026-08-09'), WEDNESDAY)).toBe(2)
  })

  it('exclut la semaine précédente et la suivante', () => {
    expect(sessionsInWeek(s('2026-08-02', '2026-08-10'), WEDNESDAY)).toBe(0)
  })

  it('rend 0 sur un historique vide', () => {
    expect(sessionsInWeek([], WEDNESDAY)).toBe(0)
  })
})

describe('currentStreak', () => {
  it('compte les jours consécutifs en remontant depuis aujourd’hui', () => {
    expect(currentStreak(s('2026-08-05', '2026-08-04', '2026-08-03'), WEDNESDAY)).toBe(3)
  })

  it('reste ouverte quand rien n’a encore été fait aujourd’hui', () => {
    expect(currentStreak(s('2026-08-04', '2026-08-03'), WEDNESDAY)).toBe(2)
  })

  it('rend 0 quand ni aujourd’hui ni hier ne portent de session', () => {
    expect(currentStreak(s('2026-08-03', '2026-08-02'), WEDNESDAY)).toBe(0)
  })

  it('s’arrête au premier trou', () => {
    expect(currentStreak(s('2026-08-05', '2026-08-03', '2026-08-02'), WEDNESDAY)).toBe(1)
  })

  it('ne compte qu’une fois plusieurs sessions du même jour', () => {
    expect(currentStreak(s('2026-08-05', '2026-08-05'), WEDNESDAY)).toBe(1)
  })

  it('traverse un changement de mois', () => {
    expect(currentStreak(s('2026-08-01', '2026-07-31', '2026-07-30'), '2026-08-01')).toBe(3)
  })

  it('rend 0 sur un historique vide', () => {
    expect(currentStreak([], WEDNESDAY)).toBe(0)
  })
})

describe('lastSession', () => {
  const timed = (started_at: string): BreathingSessionTimed => ({ date: started_at.slice(0, 10), started_at })

  it('rend la session la plus récente quel que soit l’ordre d’entrée', () => {
    const found = lastSession([timed('2026-07-30T08:00:00'), timed('2026-08-05T07:00:00'), timed('2026-08-01T20:00:00')])
    expect(found?.started_at).toBe('2026-08-05T07:00:00')
  })

  it('départage deux sessions du même jour sur l’heure', () => {
    const found = lastSession([timed('2026-08-05T07:00:00'), timed('2026-08-05T21:30:00')])
    expect(found?.started_at).toBe('2026-08-05T21:30:00')
  })

  it('rend null sur un historique vide', () => {
    expect(lastSession([])).toBeNull()
  })
})
