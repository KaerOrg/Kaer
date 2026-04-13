// expo-notifications (push remote) n'est plus supporté dans Expo Go SDK 53+.
// Ces fonctions sont des stubs temporaires — elles ne font rien mais ne bloquent pas l'app.
// Les vraies implémentations seront restaurées lors de la création d'un development build.

export async function requestNotificationPermission(): Promise<boolean> {
  return false
}

export async function setupAndroidChannel(): Promise<void> {
  // stub
}

export async function scheduleSleepDiaryReminder(
  _hour: number,
  _minute: number
): Promise<string> {
  return ''
}

export async function cancelSleepDiaryReminder(): Promise<void> {
  // stub
}

export async function getSleepDiaryReminderTime(): Promise<{
  hour: number
  minute: number
} | null> {
  return null
}
