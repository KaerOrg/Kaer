import { describe, it, expect } from 'vitest'
import { shiftDate, mondayOf, weekDays, todayIso, dateToIso } from './weekDates'

describe('weekDates.dateToIso', () => {
  it('formate depuis les composants locaux (pas UTC — zéro décalage de jour)', () => {
    // Minuit local : toISOString() basculerait sur la veille en fuseau positif ;
    // dateToIso doit rendre le jour local tel quel.
    const localMidnight = new Date(2026, 6, 5, 0, 0, 0) // 5 juillet 2026, 00:00 local
    expect(dateToIso(localMidnight)).toBe('2026-07-05')
  })

  it('zero-pad le mois et le jour', () => {
    expect(dateToIso(new Date(2026, 0, 9, 12, 0, 0))).toBe('2026-01-09')
  })
})

describe('weekDates.shiftDate', () => {
  it('décale en avant et en arrière, y compris à cheval sur un mois', () => {
    expect(shiftDate('2026-06-30', 1)).toBe('2026-07-01')
    expect(shiftDate('2026-07-01', -1)).toBe('2026-06-30')
    expect(shiftDate('2026-06-15', 7)).toBe('2026-06-22')
  })

  it("gère le passage d'année", () => {
    expect(shiftDate('2025-12-31', 1)).toBe('2026-01-01')
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('weekDates.mondayOf', () => {
  it('retourne le lundi de la semaine (2026-07-01 est un mercredi)', () => {
    expect(mondayOf('2026-07-01')).toBe('2026-06-29')
  })

  it('un lundi reste lui-même', () => {
    expect(mondayOf('2026-06-29')).toBe('2026-06-29')
  })

  it('un dimanche remonte au lundi précédent (pas au lendemain)', () => {
    expect(mondayOf('2026-07-05')).toBe('2026-06-29')
  })
})

describe('weekDates.weekDays', () => {
  it('retourne les 7 jours consécutifs à partir du lundi', () => {
    expect(weekDays('2026-06-29')).toEqual([
      '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02',
      '2026-07-03', '2026-07-04', '2026-07-05',
    ])
  })
})

describe('weekDates.todayIso', () => {
  it('retourne une date ISO locale valide', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
