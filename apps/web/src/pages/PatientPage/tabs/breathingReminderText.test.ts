import { describe, it, expect } from 'vitest'
import { formatReminderDays, isReminderActive } from './breathingReminderText'
import type { BreathingReminder } from '@services/engagementService'

const LABELS = ['L', 'M', 'Me', 'J', 'V', 'S', 'D']

const reminder = (over: Partial<BreathingReminder> = {}): BreathingReminder => ({
  enabled: true, time: '21:00', days: [1, 3], updatedAt: '2026-08-05T10:00:00Z', ...over,
})

describe('formatReminderDays', () => {
  it('affiche les jours dans l’ordre de la semaine, pas dans l’ordre stocké', () => {
    // 0 = dimanche, stocké en tête, doit s'afficher en fin de semaine.
    expect(formatReminderDays([0, 1, 3], LABELS)).toBe('L · Me · D')
  })

  it('rend une chaîne vide sans jour coché', () => {
    expect(formatReminderDays([], LABELS)).toBe('')
  })

  it('rend un seul jour sans séparateur', () => {
    expect(formatReminderDays([5], LABELS)).toBe('V')
  })
})

describe('isReminderActive', () => {
  it('est actif quand la bascule, l’heure et au moins un jour sont posés', () => {
    expect(isReminderActive(reminder())).toBe(true)
  })

  it('n’est pas actif sans réglage du tout', () => {
    expect(isReminderActive(null)).toBe(false)
  })

  it('n’est pas actif quand la bascule est coupée', () => {
    expect(isReminderActive(reminder({ enabled: false }))).toBe(false)
  })

  it('n’est pas actif sans heure : rien ne se déclencherait côté patient', () => {
    expect(isReminderActive(reminder({ time: null }))).toBe(false)
  })

  it('n’est pas actif sans jour : rien ne se déclencherait non plus', () => {
    expect(isReminderActive(reminder({ days: [] }))).toBe(false)
  })
})
