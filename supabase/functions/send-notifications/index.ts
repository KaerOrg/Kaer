// Edge Function : send-notifications
// Déclenchée par pg_cron toutes les minutes.
// Lit les notification_routines actives dont l'heure courante correspond,
// envoie via FCM HTTP v1 (token_type='fcm') ou Expo Push API (token_type='expo'),
// puis journalise dans notification_logs.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const FCM_PROJECT_ID = 'kaer-84ba7'

interface NotificationRoutine {
  id: string
  patient_id: string
  days_of_week: number[]
  time_of_day: string
  patient_time_override: string | null
  practitioner_note: string | null
}

interface PushTokenRow {
  patient_id: string
  expo_push_token: string
  token_type: 'expo' | 'fcm'
}

interface ExpoMessage {
  to: string
  title: string
  body: string
  data?: Record<string, string>
  channelId?: string
}

function getCurrentISODay(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

function getCurrentHHMM(): string {
  const now = new Date()
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// ── FCM HTTP v1 ──────────────────────────────────────────────────────────────

async function getFCMAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string
    private_key: string
  }

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${header}.${payload}`
  const pkcs8 = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const keyBytes = Uint8Array.from(atob(pkcs8), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(signingInput),
  )

  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const { access_token } = await res.json() as { access_token: string }
  return access_token
}

async function sendFCMMessage(
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string,
): Promise<void> {
  await fetch(
    `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
          android: { channel_id: 'psytool-reminders' },
        },
      }),
    },
  )
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const currentDay = getCurrentISODay()
  const currentTime = getCurrentHHMM()

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

  const due = (routines as NotificationRoutine[]).filter(r => {
    const effectiveTime = r.patient_time_override ?? r.time_of_day
    return effectiveTime === currentTime
  })

  if (due.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  const patientIds = [...new Set(due.map(r => r.patient_id))]
  const { data: tokens } = await supabase
    .from('patient_push_tokens')
    .select('patient_id, expo_push_token, token_type')
    .in('patient_id', patientIds)

  const tokensByPatient = new Map<string, PushTokenRow[]>()
  for (const row of (tokens ?? []) as PushTokenRow[]) {
    const list = tokensByPatient.get(row.patient_id) ?? []
    list.push(row)
    tokensByPatient.set(row.patient_id, list)
  }

  const expoMessages: ExpoMessage[] = []
  const fcmPayloads: { token: string; title: string; body: string }[] = []
  const logs: { routine_id: string; patient_id: string; status: string }[] = []

  for (const routine of due) {
    const routineTokens = tokensByPatient.get(routine.patient_id) ?? []
    const msgTitle = 'Kær'
    const msgBody = routine.practitioner_note ?? 'Vous avez un exercice à faire aujourd\'hui.'

    for (const row of routineTokens) {
      if (row.token_type === 'fcm') {
        fcmPayloads.push({ token: row.expo_push_token, title: msgTitle, body: msgBody })
      } else {
        expoMessages.push({
          to: row.expo_push_token,
          title: msgTitle,
          body: msgBody,
          channelId: 'psytool-reminders',
        })
      }
    }
    logs.push({ routine_id: routine.id, patient_id: routine.patient_id, status: 'sent' })
  }

  // Expo Push API (tokens legacy)
  const CHUNK_SIZE = 100
  for (let i = 0; i < expoMessages.length; i += CHUNK_SIZE) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(expoMessages.slice(i, i + CHUNK_SIZE)),
      })
    } catch (err) {
      console.error('Erreur envoi Expo Push:', err)
    }
  }

  // FCM HTTP v1
  if (fcmPayloads.length > 0) {
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')
    if (serviceAccountJson) {
      try {
        const accessToken = await getFCMAccessToken(serviceAccountJson)
        for (const payload of fcmPayloads) {
          await sendFCMMessage(accessToken, payload.token, payload.title, payload.body)
        }
      } catch (err) {
        console.error('Erreur envoi FCM:', err)
      }
    } else {
      console.warn('FCM_SERVICE_ACCOUNT_JSON non configuré — tokens FCM ignorés')
    }
  }

  if (logs.length > 0) {
    await supabase.from('notification_logs').insert(logs)
  }

  return new Response(
    JSON.stringify({ sent: expoMessages.length + fcmPayloads.length }),
    { status: 200 },
  )
})
