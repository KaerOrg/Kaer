import { describe, it, expect } from 'vitest'
import { shiftDate, mondayOf, weekDays, todayIso } from './weekDates'

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
