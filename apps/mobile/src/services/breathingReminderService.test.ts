const mockEnsurePermission = jest.fn().mockResolvedValue(true)
jest.mock('./permissionsService', () => ({
  ensurePermission: (...a: unknown[]) => mockEnsurePermission(...a),
}))

import * as Notifications from 'expo-notifications'
import { syncBreathingReminders, cancelBreathingReminders } from './breathingReminderService'
import type { ReminderSettings } from '../lib/breathingReminderPlan'

const schedule = Notifications.scheduleNotificationAsync as jest.Mock
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock
const getAll = Notifications.getAllScheduledNotificationsAsync as jest.Mock

const TITLE = 'Un moment pour respirer ?'
const BODY = 'Votre rappel de respiration.'

const settings = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({
  reminder_enabled: true,
  reminder_time: '21:00',
  reminder_days: [1, 3],
  ...over,
})

/** Une notification déjà programmée, telle que l'OS la renvoie. */
const scheduled = (identifier: string, kind: string) => ({
  identifier,
  content: { data: { kind } },
})

beforeEach(() => {
  jest.clearAllMocks()
  mockEnsurePermission.mockResolvedValue(true)
  getAll.mockResolvedValue([])
})

describe('syncBreathingReminders', () => {
  it('programme une notification par jour choisi', async () => {
    const result = await syncBreathingReminders(settings(), TITLE, BODY)
    expect(result).toEqual({ status: 'scheduled', count: 2 })
    expect(schedule).toHaveBeenCalledTimes(2)
  })

  it('programme à l’heure et au jour demandés, en récurrence hebdomadaire', async () => {
    await syncBreathingReminders(settings({ reminder_days: [1] }), TITLE, BODY)
    expect(schedule).toHaveBeenCalledWith(expect.objectContaining({
      trigger: { type: 'weekly', weekday: 2, hour: 21, minute: 0 },
    }))
  })

  it('envoie le texte reçu, sans le composer ni l’interpoler', async () => {
    await syncBreathingReminders(settings({ reminder_days: [1] }), TITLE, BODY)
    const { content } = schedule.mock.calls[0][0]
    expect(content.title).toBe(TITLE)
    expect(content.body).toBe(BODY)
  })

  it('porte le module et le hub dans le payload, pour le tap', async () => {
    await syncBreathingReminders(settings({ reminder_days: [1] }), TITLE, BODY)
    const { content } = schedule.mock.calls[0][0]
    expect(content.data).toEqual({
      kind: 'breathing_reminder', module_type: 'breathing_techniques', screen: 'home',
    })
  })

  it('annule avant de reprogrammer : modifier l’heure ne crée pas de doublon', async () => {
    getAll.mockResolvedValue([
      scheduled('old-1', 'breathing_reminder'),
      scheduled('old-2', 'breathing_reminder'),
    ])
    await syncBreathingReminders(settings({ reminder_time: '08:00' }), TITLE, BODY)
    expect(cancel).toHaveBeenCalledWith('old-1')
    expect(cancel).toHaveBeenCalledWith('old-2')
    expect(schedule).toHaveBeenCalledTimes(2)
  })

  it('n’annule que ses propres notifications, pas celles des autres modules', async () => {
    getAll.mockResolvedValue([
      scheduled('mine', 'breathing_reminder'),
      scheduled('sleep', 'sleep_diary_reminder'),
      scheduled('sans-kind', ''),
    ])
    await syncBreathingReminders(settings({ reminder_days: [1] }), TITLE, BODY)
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledWith('mine')
  })

  it('coupe tout et ne programme rien quand la bascule est désactivée', async () => {
    getAll.mockResolvedValue([scheduled('old-1', 'breathing_reminder')])
    const result = await syncBreathingReminders(settings({ reminder_enabled: false }), TITLE, BODY)
    expect(cancel).toHaveBeenCalledWith('old-1')
    expect(schedule).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'scheduled', count: 0 })
  })

  it('ne programme rien sans jour coché', async () => {
    const result = await syncBreathingReminders(settings({ reminder_days: [] }), TITLE, BODY)
    expect(schedule).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'scheduled', count: 0 })
  })

  it('ne demande la permission que s’il y a réellement un rappel à poser', async () => {
    await syncBreathingReminders(settings({ reminder_enabled: false }), TITLE, BODY)
    expect(mockEnsurePermission).not.toHaveBeenCalled()
  })

  it('signale le refus de notification sans programmer', async () => {
    mockEnsurePermission.mockResolvedValue(false)
    const result = await syncBreathingReminders(settings(), TITLE, BODY)
    expect(result).toEqual({ status: 'permission_denied' })
    expect(schedule).not.toHaveBeenCalled()
  })

  it('annule quand même l’existant si la permission vient d’être retirée', async () => {
    getAll.mockResolvedValue([scheduled('old-1', 'breathing_reminder')])
    mockEnsurePermission.mockResolvedValue(false)
    await syncBreathingReminders(settings(), TITLE, BODY)
    expect(cancel).toHaveBeenCalledWith('old-1')
  })
})

describe('cancelBreathingReminders', () => {
  it('annule tous les rappels du module', async () => {
    getAll.mockResolvedValue([
      scheduled('a', 'breathing_reminder'),
      scheduled('b', 'breathing_reminder'),
    ])
    await cancelBreathingReminders()
    expect(cancel).toHaveBeenCalledTimes(2)
  })

  it('ne fait rien, et n’échoue pas, sans rappel programmé', async () => {
    await expect(cancelBreathingReminders()).resolves.toBeUndefined()
    expect(cancel).not.toHaveBeenCalled()
  })
})
