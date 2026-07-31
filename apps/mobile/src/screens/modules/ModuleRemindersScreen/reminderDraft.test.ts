import {
  toDraft, newDraft, toggleDay, isShifted, frequencyLabel, ALL_DAYS, DEFAULT_NEW_TIME,
  type ReminderDraft,
} from './reminderDraft'
import type { NotificationRoutine } from '@services/notificationService'

function routine(over: Partial<NotificationRoutine> = {}): NotificationRoutine {
  return {
    id: 'r1',
    patient_module_id: 'pm1',
    practitioner_id: 'pr1',
    patient_id: 'pt1',
    days_of_week: [1, 3, 5],
    time_of_day: '09:00',
    patient_time_override: null,
    practitioner_note: null,
    is_active: true,
    patient_paused: false,
    created_at: '',
    updated_at: '',
    ...over,
  } as NotificationRoutine
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

describe('toDraft', () => {
  it('prend l\'heure effective : le décalage du patient prime', () => {
    const d = toDraft(routine({ time_of_day: '09:00', patient_time_override: '08:30' }))
    expect(d.time).toBe('08:30')
    expect(d.baseTime).toBe('09:00')
  })

  it('retombe sur l\'heure posée quand le patient n\'a rien changé', () => {
    expect(toDraft(routine()).time).toBe('09:00')
  })

  it('trie les jours', () => {
    expect(toDraft(routine({ days_of_week: [5, 1, 3] })).days).toEqual([1, 3, 5])
  })
})

describe('newDraft', () => {
  it('propose tous les jours et une heure neutre, sans id serveur', () => {
    const d = newDraft('tmp-1')
    expect(d.id).toBeNull()
    expect(d.days).toEqual([...ALL_DAYS])
    expect(d.time).toBe(DEFAULT_NEW_TIME)
    expect(d.paused).toBe(false)
  })
})

describe('toggleDay', () => {
  const base: ReminderDraft = { id: 'r1', key: 'r1', time: '09:00', days: [1, 3, 5], paused: false, baseTime: '09:00' }

  it('ajoute un jour en gardant l\'ordre', () => {
    expect(toggleDay(base, 2).days).toEqual([1, 2, 3, 5])
  })

  it('retire un jour déjà retenu', () => {
    expect(toggleDay(base, 3).days).toEqual([1, 5])
  })

  it('REFUSE de retirer le dernier jour : un rappel sans jour ne partirait jamais', () => {
    const single: ReminderDraft = { ...base, days: [4] }
    expect(toggleDay(single, 4)).toBe(single)
  })
})

describe('isShifted', () => {
  it('signale un décalage seulement sur un rappel déjà enregistré', () => {
    expect(isShifted({ id: 'r1', key: 'r1', time: '08:30', days: [1], paused: false, baseTime: '09:00' })).toBe(true)
    expect(isShifted({ id: 'r1', key: 'r1', time: '09:00', days: [1], paused: false, baseTime: '09:00' })).toBe(false)
    // Un rappel que le patient vient d'ajouter n'est décalé par rapport à rien.
    expect(isShifted({ id: null, key: 'tmp', time: '18:00', days: [1], paused: false, baseTime: '18:00' })).toBe(false)
  })
})

describe('frequencyLabel', () => {
  it('dit « tous les jours » quand les sept jours sont retenus', () => {
    const d = newDraft('tmp')
    expect(frequencyLabel(d, 'tous les jours', DAY_LABELS)).toBe('tous les jours')
  })

  it('énumère les jours retenus sinon', () => {
    const d: ReminderDraft = { id: 'r1', key: 'r1', time: '09:00', days: [1, 5], paused: false, baseTime: '09:00' }
    expect(frequencyLabel(d, 'tous les jours', DAY_LABELS)).toBe('L, V')
  })
})
