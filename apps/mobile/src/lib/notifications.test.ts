import * as Notifications from 'expo-notifications'
import {
  requestNotificationPermission,
  scheduleSleepDiaryReminder,
  cancelSleepDiaryReminder,
  getSleepDiaryReminderTime,
} from './notifications'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('requestNotificationPermission', () => {
  it('retourne true si la permission est déjà accordée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('demande la permission si non accordée et retourne true si accordée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('retourne false si la permission est refusée', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never)
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})

describe('cancelSleepDiaryReminder', () => {
  it('ne fait rien si aucune notification programmée', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([])
    await cancelSleepDiaryReminder()
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled()
  })

  it('annule uniquement les notifications de type sleep_diary', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
      { identifier: 'id-1', content: { data: { type: 'sleep_diary' } }, trigger: {} },
      { identifier: 'id-2', content: { data: { type: 'other' } }, trigger: {} },
    ] as never)

    await cancelSleepDiaryReminder()

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1)
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-1')
  })
})

describe('scheduleSleepDiaryReminder', () => {
  it('programme une notification et retourne un id', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([])
    jest.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('new-id')

    const id = await scheduleSleepDiaryReminder(8, 0)

    expect(id).toBe('new-id')
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 8, minute: 0 }),
      })
    )
  })

  it('annule le rappel précédent avant de programmer le nouveau', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
      { identifier: 'old-id', content: { data: { type: 'sleep_diary' } }, trigger: {} },
    ] as never)

    await scheduleSleepDiaryReminder(9, 30)

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-id')
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
  })
})

describe('getSleepDiaryReminderTime', () => {
  it('retourne null si aucune notification programmée', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([])
    const result = await getSleepDiaryReminderTime()
    expect(result).toBeNull()
  })

  it("retourne l'heure du rappel sleep_diary", async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
      {
        identifier: 'id-1',
        content: { data: { type: 'sleep_diary' } },
        trigger: { hour: 8, minute: 30 },
      },
    ] as never)

    const result = await getSleepDiaryReminderTime()
    expect(result).toEqual({ hour: 8, minute: 30 })
  })

  it('ignore les notifications qui ne sont pas sleep_diary', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
      {
        identifier: 'id-2',
        content: { data: { type: 'other' } },
        trigger: { hour: 10, minute: 0 },
      },
    ] as never)

    const result = await getSleepDiaryReminderTime()
    expect(result).toBeNull()
  })
})
