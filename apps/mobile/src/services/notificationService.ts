// expo-notifications (push remote) n'est pas supporté dans Expo Go SDK 53+.
// Le token push ne peut être obtenu qu'avec un development build.
// Les fonctions sont implémentées mais registerPushToken retourne null dans Expo Go.

import * as Notifications from 'expo-notifications'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

// Clé AsyncStorage : mémorise que l'écran d'explication des notifications a déjà été présenté.
const ONBOARDING_SEEN_KEY = 'notif_onboarding_shown'

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
 * Enregistre le token push du device courant en base Supabase.
 * Android (build local) : FCM natif via getDevicePushTokenAsync().
 * iOS / fallback : Expo Push Token.
 * Retourne null si la permission est refusée ou si l'app tourne dans Expo Go.
 */
export async function registerPushToken(patientId: string): Promise<string | null> {
  if (isExpoGo) return null
  const granted = await requestNotificationPermission()
  if (!granted) return null

  await setupAndroidChannel()

  const platform: NotificationPlatform = Platform.OS === 'android' ? 'android' : 'ios'
  let token: string
  let tokenType: 'fcm' | 'expo'

  if (Platform.OS === 'android') {
    try {
      const result = await Notifications.getDevicePushTokenAsync()
      token = result.data
      tokenType = 'fcm'
    } catch {
      return null
    }
  } else {
    try {
      const result = await Notifications.getExpoPushTokenAsync()
      token = result.data
      tokenType = 'expo'
    } catch {
      return null
    }
  }

  const { error } = await supabase.from('patient_push_tokens').upsert(
    {
      patient_id: patientId,
      expo_push_token: token,
      token_type: tokenType,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  )

  if (error) return null
  return token
}

/**
 * Enregistre le token push uniquement si la permission est déjà accordée.
 * Appelé au login pour rafraîchir le token sans redéclencher de prompt système
 * (le prompt initial est géré par l'écran d'onboarding des notifications).
 */
export async function registerPushTokenIfGranted(patientId: string): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') return null
  return registerPushToken(patientId)
}

// ── Onboarding notifications (écran d'explication + permission) ──────────────

/**
 * Détermine si l'écran d'explication des notifications doit être présenté :
 * permission encore indéterminée ET écran jamais affiché auparavant.
 * Tolère une erreur AsyncStorage en ne montrant pas l'écran (jamais bloquant).
 */
export async function shouldShowNotificationOnboarding(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
    if (seen !== null) return false
    const { status } = await Notifications.getPermissionsAsync()
    return status === 'undetermined'
  } catch {
    return false
  }
}

/** Mémorise que l'écran d'onboarding des notifications a été présenté. */
export async function markNotificationOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1')
  } catch {
    // non bloquant — au pire l'écran sera reproposé au prochain lancement
  }
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

export interface NotificationRoutineWithModule extends NotificationRoutine {
  module_type: string
}

export async function getAllRoutinesForPatient(
  patientId: string
): Promise<NotificationRoutineWithModule[]> {
  const { data } = await supabase
    .from('notification_routines')
    .select('*, patient_module:patient_modules(module_type)')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!data) return []
  return data.map(r => ({
    ...r,
    module_type: (r.patient_module as { module_type: string } | null)?.module_type ?? '',
  }))
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

  // Événement de notification vers le flux d'activité praticien (non critique).
  void supabase.from('notification_events').insert({
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
