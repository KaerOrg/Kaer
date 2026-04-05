import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Comportement des notifications quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Demande la permission d'envoyer des notifications
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// Configure le canal Android (obligatoire sur Android 8+)
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('psytool', {
      name: 'PsyTool',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    })
  }
}

// Programme un rappel quotidien pour l'agenda du sommeil
// hour et minute : heure locale (ex: 8, 0 pour 08:00)
export async function scheduleSleepDiaryReminder(
  hour: number,
  minute: number
): Promise<string> {
  await cancelSleepDiaryReminder()
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Agenda du sommeil 🌙',
      body: "N'oubliez pas de noter votre nuit d'hier.",
      data: { type: 'sleep_diary' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
  return id
}

// Annule tous les rappels de l'agenda du sommeil
export async function cancelSleepDiaryReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if ((notif.content.data as { type?: string })?.type === 'sleep_diary') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }
}

// Vérifie si un rappel est déjà programmé et retourne son heure
export async function getSleepDiaryReminderTime(): Promise<{
  hour: number
  minute: number
} | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if ((notif.content.data as { type?: string })?.type === 'sleep_diary') {
      const trigger = notif.trigger as { hour?: number; minute?: number }
      if (trigger.hour !== undefined && trigger.minute !== undefined) {
        return { hour: trigger.hour, minute: trigger.minute }
      }
    }
  }
  return null
}
