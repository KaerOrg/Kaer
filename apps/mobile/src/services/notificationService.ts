// expo-notifications (push remote) n'est pas supporté dans Expo Go SDK 53+.
// Le token push ne peut être obtenu qu'avec un development build.
// Les fonctions sont implémentées mais registerPushToken retourne null dans Expo Go.

import * as Notifications from 'expo-notifications'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

export type NotificationPlatform = 'ios' | 'android'

export interface NotificationRoutine {
  id: string
  patient_module_id: string
  practitioner_id: string
  patient_id: string
  days_of_week: number[]
  time_of_day: string
  patient_time_override: string | null
  practitioner_note: string | null
  is_active: boolean
  patient_paused: boolean
  created_at: string
  updated_at: string
}

// ── Permissions & token ─────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  if (isExpoGo) return
  await Notifications.setNotificationChannelAsync('psytool-reminders', {
    name: 'Rappels thérapeutiques',
    importance: Notifications.AndroidImportance.HIGH,
  })
}

/**
 * Enregistre le token Expo push du device courant en base Supabase.
 * Retourne null si la permission est refusée ou si l'app tourne dans Expo Go.
 */
export async function registerPushToken(patientId: string): Promise<string | null> {
  if (isExpoGo) return null
  const granted = await requestNotificationPermission()
  if (!granted) return null

  await setupAndroidChannel()

  let token: string
  try {
    const result = await Notifications.getExpoPushTokenAsync()
    token = result.data
  } catch {
    // getExpoPushTokenAsync échoue dans Expo Go SDK 53+ — pas de dev build
    return null
  }

  const platform: NotificationPlatform = Platform.OS === 'android' ? 'android' : 'ios'

  const { error } = await supabase.from('patient_push_tokens').upsert(
    { patient_id: patientId, expo_push_token: token, platform, updated_at: new Date().toISOString() },
    { onConflict: 'expo_push_token' }
  )

  if (error) return null
  return token
}

// ── Routines (lecture patient) ──────────────────────────────────────────────

export async function getRoutinesForModule(
  patientModuleId: string
): Promise<NotificationRoutine[]> {
  const { data, error } = await supabase
    .from('notification_routines')
    .select('*')
    .eq('patient_module_id', patientModuleId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data ?? []
}

// ── Pause / reprise (action patient) ───────────────────────────────────────

export async function pauseRoutine(
  routineId: string,
  patientId: string,
  moduleType: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notification_routines')
    .update({ patient_paused: true, updated_at: new Date().toISOString() })
    .eq('id', routineId)
    .eq('patient_id', patientId)

  if (error) return false

  // Signal d'observance vers le praticien (non critique)
  void supabase.from('patient_engagement_logs').insert({
    patient_id: patientId,
    event_type: 'NOTIFICATION_PAUSED',
    metadata: { routine_id: routineId, module_type: moduleType },
  })

  return true
}

export async function resumeRoutine(
  routineId: string,
  patientId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notification_routines')
    .update({ patient_paused: false, updated_at: new Date().toISOString() })
    .eq('id', routineId)
    .eq('patient_id', patientId)

  return !error
}

// ── Override heure (action patient) ────────────────────────────────────────

export async function updateTimeOverride(
  routineId: string,
  patientId: string,
  timeOverride: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('notification_routines')
    .update({ patient_time_override: timeOverride, updated_at: new Date().toISOString() })
    .eq('id', routineId)
    .eq('patient_id', patientId)

  return !error
}

// ── Stubs scheduling local (conservés pour compatibilité) ──────────────────

export async function scheduleSleepDiaryReminder(
  _hour: number,
  _minute: number
): Promise<string> {
  return ''
}

export async function cancelSleepDiaryReminder(): Promise<void> {
  // stub — les rappels sleep_diary passent par notification_routines
}

export async function getSleepDiaryReminderTime(): Promise<{
  hour: number
  minute: number
} | null> {
  return null
}
