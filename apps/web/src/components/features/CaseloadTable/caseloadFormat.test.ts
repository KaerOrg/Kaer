import { describe, it, expect } from 'vitest'
import { describeDue, alertVariant } from './caseloadFormat'

const TODAY = '2026-06-02'

describe('describeDue', () => {
  it("renvoie 'none' sans échéance", () => {
    expect(describeDue(null, TODAY)).toEqual({ kind: 'none' })
  })

  it('détecte un retard avec le nombre de jours', () => {
    expect(describeDue('2026-05-30', TODAY)).toEqual({ kind: 'overdue', days: 3 })
  })

  it("détecte l'échéance du jour", () => {
    expect(describeDue(TODAY, TODAY)).toEqual({ kind: 'today' })
  })

  it('détecte une échéance future avec le nombre de jours', () => {
    expect(describeDue('2026-06-05', TODAY)).toEqual({ kind: 'upcoming', days: 3 })
  })
})

describe('alertVariant', () => {
  it('mappe chaque niveau vers la bonne variante de badge', () => {
    expect(alertVariant('critical')).toBe('danger')
    expect(alertVariant('upcoming')).toBe('warning')
    expect(alertVariant('ok')).toBe('success')
  })
})
