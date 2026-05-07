import { supabase } from '../lib/supabase'

export type EngagementEventType =
  | 'SAVE_BECK_THOUGHT_RECORD'
  | 'SAVE_FEAR_ENTRY'
  | 'SAVE_MEDICATION_ADHERENCE'
  | 'SAVE_BEHAVIORAL_ACTIVATION'
  | 'SAVE_BREATHING_SESSION'
  | 'UPDATE_DECISIONAL_BALANCE'

export async function logEvent(
  patientId: string,
  eventType: EngagementEventType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('patient_engagement_logs').insert({
      patient_id: patientId,
      event_type: eventType,
      metadata,
    })
  } catch {
    // Signal d'observance non critique : on n'interrompt jamais le flux patient.
  }
}
