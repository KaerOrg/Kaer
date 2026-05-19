// Edge Function : send-notifications
// Déclenchée par pg_cron toutes les minutes.
// Lit les notification_routines actives dont l'heure courante correspond,
// envoie via l'API Expo Push, puis journalise dans notification_logs.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface NotificationRoutine {
  id: string
  patient_id: string
  days_of_week: number[]
  time_of_day: string
  patient_time_override: string | null
  practitioner_note: string | null
}

interface PushToken {
  expo_push_token: string
}

interface ExpoMessage {
  to: string
  title: string
  body: string
  data?: Record<string, string>
  channelId?: string
}

function getCurrentISODay(): number {
  // ISO day : 1=lun … 7=dim
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

function getCurrentHHMM(): string {
  const now = new Date()
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const currentDay = getCurrentISODay()
  const currentTime = getCurrentHHMM()

  // Routines actives, non mises en pause, dont le jour correspond
  const { data: routines, error: routinesErr } = await supabase
    .from('notification_routines')
    .select('id, patient_id, days_of_week, time_of_day, patient_time_override, practitioner_note')
    .eq('is_active', true)
    .eq('patient_paused', false)
    .contains('days_of_week', [currentDay])

  if (routinesErr) {
    console.error('Erreur lecture routines:', routinesErr)
    return new Response(JSON.stringify({ error: routinesErr.message }), { status: 500 })
  }

  if (!routines || routines.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  // Filtrer sur l'heure effective (patient_time_override ?? time_of_day)
  const due = (routines as NotificationRoutine[]).filter(r => {
    const effectiveTime = r.patient_time_override ?? r.time_of_day
    return effectiveTime === currentTime
  })

  if (due.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  // Récupérer les tokens des patients concernés
  const patientIds = [...new Set(due.map(r => r.patient_id))]
  const { data: tokens } = await supabase
    .from('patient_push_tokens')
    .select('patient_id, expo_push_token')
    .in('patient_id', patientIds)

  const tokensByPatient = new Map<string, string[]>()
  for (const row of (tokens ?? []) as (PushToken & { patient_id: string })[]) {
    const list = tokensByPatient.get(row.patient_id) ?? []
    list.push(row.expo_push_token)
    tokensByPatient.set(row.patient_id, list)
  }

  const messages: ExpoMessage[] = []
  const logs: { routine_id: string; patient_id: string; status: string }[] = []

  for (const routine of due) {
    const routineTokens = tokensByPatient.get(routine.patient_id) ?? []
    for (const token of routineTokens) {
      messages.push({
        to: token,
        title: 'PsyTool',
        body: routine.practitioner_note ?? 'Vous avez un exercice à faire aujourd\'hui.',
        channelId: 'psytool-reminders',
      })
    }
    logs.push({ routine_id: routine.id, patient_id: routine.patient_id, status: 'sent' })
  }

  // Envoi par chunks de 100 (limite Expo Push API)
  const CHUNK_SIZE = 100
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE)
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      })
    } catch (err) {
      console.error('Erreur envoi Expo Push:', err)
    }
  }

  // Journaliser les envois
  if (logs.length > 0) {
    await supabase.from('notification_logs').insert(logs)
  }

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 })
})
