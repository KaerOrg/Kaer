// expo-notifications (push remote) n'est pas supporté dans Expo Go SDK 53+.
// Le token push ne peut être obtenu qu'avec un development build.
// Les fonctions sont implémentées mais registerPushToken retourne null dans Expo Go.

import * as Notifications from 'expo-notifications'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { checkPermission, ensurePermission } from './permissionsService'

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

// ── Affichage au premier plan ────────────────────────────────────────────────

/**
 * Configure l'affichage des notifications reçues alors que l'app est ouverte
 * au premier plan. À appeler une seule fois, le plus tôt possible au boot.
 *
 * En foreground, la bannière OS est supprimée (`shouldShowBanner: false`) : la
 * notification est présentée à la place par le Toast in-app via le hook
 * `useForegroundNotificationToast` (`addNotificationReceivedListener`). La notif
 * reste listée dans le centre de notifications (`shouldShowList: true`) et joue
 * son son. En arrière-plan / écran verrouillé, l'OS affiche la bannière normalement.
 */
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

// ── Permissions & token ─────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  // Délègue au service d'autorisations générique (« vérifier puis demander »).
  return ensurePermission('notifications')
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
  if ((await checkPermission('notifications')) !== 'granted') return null
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
    return (await checkPermission('notifications')) === 'undetermined'
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

/**
 * Le module affecté au patient, pour ce type : identité de la ligne et praticien qui
 * l'a posée. Nécessaire pour ajouter un rappel, qui reste rattaché à ce praticien.
 */
export async function getPatientModuleRef(
  patientId: string,
  moduleType: string
): Promise<{ id: string; practitioner_id: string } | null> {
  const { data } = await supabase
    .from('patient_modules')
    .select('id, practitioner_id')
    .eq('patient_id', patientId)
    .eq('module_type', moduleType)
    .is('revoked_at', null)
    .maybeSingle()

  return data ?? null
}

// ── Jours, création, suppression (actions patient, #257) ───────────────────
//
// Le rythme initial est posé en séance avec le praticien, mais il appartient ensuite
// au patient : sans sollicitation, le module n'est ouvert qu'en pic de crise, et
// c'est la répétition qui entraîne la granularité. Ces trois fonctions sont donc des
// actions PATIENT, protégées par RLS sur `patient_id`.

/** Jours de la semaine choisis par le patient (ISO 1=lundi … 7=dimanche). */
export async function updateRoutineDays(
  routineId: string,
  patientId: string,
  daysOfWeek: number[]
): Promise<boolean> {
  if (daysOfWeek.length === 0) return false
  const { error } = await supabase
    .from('notification_routines')
    .update({ days_of_week: [...daysOfWeek].sort((a, b) => a - b), updated_at: new Date().toISOString() })
    .eq('id', routineId)
    .eq('patient_id', patientId)

  return !error
}

/**
 * Nouveau rappel ajouté par le patient. `practitioner_id` est repris du module
 * affecté : la ligne reste rattachée au praticien qui suit le patient, comme celles
 * posées en séance.
 */
export async function createPatientRoutine(params: {
  patientModuleId: string
  patientId: string
  practitionerId: string
  timeOfDay: string
  daysOfWeek: number[]
}): Promise<NotificationRoutine | null> {
  const { data, error } = await supabase
    .from('notification_routines')
    .insert({
      patient_module_id: params.patientModuleId,
      patient_id: params.patientId,
      practitioner_id: params.practitionerId,
      time_of_day: params.timeOfDay,
      days_of_week: [...params.daysOfWeek].sort((a, b) => a - b),
    })
    .select('*')
    .single()

  if (error) return null
  return data
}

export async function deletePatientRoutine(
  routineId: string,
  patientId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notification_routines')
    .delete()
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
