import { supabase } from '../lib/supabase'
import type {
  NotificationRoutine,
  NotificationRoutineInsert,
  NotificationRoutineUpdate,
  ActivityFeedEvent,
} from '../lib/database.types'

export async function getRoutinesForPatientModule(
  patientModuleId: string
): Promise<NotificationRoutine[]> {
  const { data, error } = await supabase
    .from('notification_routines')
    .select('*')
    .eq('patient_module_id', patientModuleId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createRoutine(
  payload: NotificationRoutineInsert
): Promise<NotificationRoutine> {
  const { data, error } = await supabase
    .from('notification_routines')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRoutine(
  id: string,
  payload: NotificationRoutineUpdate
): Promise<NotificationRoutine> {
  const { data, error } = await supabase
    .from('notification_routines')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase
    .from('notification_routines')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getActivityFeed(
  practitionerId: string,
  limit = 50
): Promise<ActivityFeedEvent[]> {
  const { data: links, error: linkError } = await supabase
    .from('practitioner_patients')
    .select('patient_id')
    .eq('practitioner_id', practitionerId)

  if (linkError) throw linkError

  const patientIds = (links ?? []).map(r => r.patient_id)
  if (patientIds.length === 0) return []

  const { data, error } = await supabase
    .from('notification_events')
    .select('*')
    .eq('event_type', 'NOTIFICATION_PAUSED')
    .in('patient_id', patientIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
