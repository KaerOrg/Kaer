// NOTE : expo-notifications n'est plus supporté dans Expo Go SDK 53+.
// Les fonctions dans notifications.ts sont des stubs temporaires.
// Ces tests vérifient le comportement des stubs jusqu'à la création d'un development build.

import {
  requestNotificationPermission,
  scheduleSleepDiaryReminder,
  cancelSleepDiaryReminder,
  getSleepDiaryReminderTime,
} from './notifications'

describe('requestNotificationPermission (stub)', () => {
  it('retourne false (stub — expo-notifications indisponible dans Expo Go SDK 53+)', async () => {
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})

describe('cancelSleepDiaryReminder (stub)', () => {
  it('ne lance pas d\'erreur', async () => {
    await expect(cancelSleepDiaryReminder()).resolves.toBeUndefined()
  })
})

describe('scheduleSleepDiaryReminder (stub)', () => {
  it('retourne une chaîne vide (stub)', async () => {
    const id = await scheduleSleepDiaryReminder(8, 0)
    expect(typeof id).toBe('string')
  })

  it('accepte n\'importe quelle heure sans erreur', async () => {
    await expect(scheduleSleepDiaryReminder(9, 30)).resolves.toBeDefined()
  })
})

describe('getSleepDiaryReminderTime (stub)', () => {
  it('retourne null (stub)', async () => {
    const result = await getSleepDiaryReminderTime()
    expect(result).toBeNull()
  })
})
