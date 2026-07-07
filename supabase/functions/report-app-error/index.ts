// #96 — Edge Function `report-app-error`.
//
// Reçoit une erreur applicative (crash ou opération échouée) depuis l'app web
// praticien ou l'app mobile patiente, la persiste dans `app_error_log` (dédup
// par signature) et notifie l'équipe par email (Resend) à la 1ʳᵉ occurrence
// d'une signature, sous cooldown + coupe-circuit global INDÉPENDANT de celui
// du render-mismatch (#90).
//
// ⚠️ MDR / RGPD : télémétrie TECHNIQUE. Aucune donnée patient (validatePayload
// ne reconstruit que message / route / kind / trace tronquée — tout extra est
// ignoré).
//
// La logique pure (validation, signature, dédup/cooldown/coupe-circuit) vit
// dans `logic.ts` et est testée sans Postgres ni Resend.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import {
  type AppErrorPayload,
  type AppErrorStore,
  escapeHtml,
  type Mailer,
  runReport,
  validatePayload,
} from './logic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Réglages anti-flood (surchargeable par env, sans redéploiement de la logique).
const COOLDOWN_MS = Number(Deno.env.get('APP_ERROR_COOLDOWN_MS') ?? 24 * 60 * 60 * 1000)
const CIRCUIT_MAX = Number(Deno.env.get('APP_ERROR_CIRCUIT_MAX') ?? 20)
const CIRCUIT_WINDOW_MS = Number(Deno.env.get('APP_ERROR_CIRCUIT_WINDOW_MS') ?? 60 * 60 * 1000)

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function makeStore(supabase: SupabaseClient): AppErrorStore {
  const table = () => supabase.from('app_error_log')
  return {
    async findBySignature(signature) {
      const { data, error } = await table()
        .select('signature, occurrence_count, email_sent_at')
        .eq('signature', signature)
        .maybeSingle()
      return { data: data ?? null, error }
    },
    async insert(row) {
      const { error } = await table().insert(row)
      return { error }
    },
    async bump(signature, lastSeenAt, occurrenceCount, emailSentAt) {
      const patch: Record<string, unknown> = {
        last_seen_at: lastSeenAt,
        occurrence_count: occurrenceCount,
      }
      // N'écrase email_sent_at QUE si un nouvel email part (cooldown dépassé) —
      // sinon on perd l'horodatage du dernier envoi et le cooldown ne tient plus.
      if (emailSentAt) patch.email_sent_at = emailSentAt
      const { error } = await table().update(patch).eq('signature', signature)
      return { error }
    },
    async countEmailsSince(sinceIso) {
      const { count, error } = await table()
        .select('id', { count: 'exact', head: true })
        .gte('email_sent_at', sinceIso)
      return { data: count ?? 0, error }
    },
  }
}

function makeMailer(): Mailer {
  const recipients = (Deno.env.get('APP_ERROR_EMAIL') ?? Deno.env.get('DEV_EMAIL') ?? 'guillaume.zarb@gmail.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const resendKey = Deno.env.get('RESEND_API_KEY')

  return {
    async send(payload: AppErrorPayload, signature: string, occurrenceCount: number) {
      if (recipients.length === 0 || !resendKey) return
      const rows = [
        ['Plateforme', payload.platform],
        ['Version app', payload.app_version],
        ['Type', payload.kind],
        ['Message', payload.message],
        ['route/écran', payload.route ?? '-'],
        ['reason', payload.reason ?? '-'],
        ['Occurrences', String(occurrenceCount)],
      ]
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#888;">${escapeHtml(k)}</td><td style="padding:4px 0;"><code>${escapeHtml(v)}</code></td></tr>`,
        )
        .join('')
      const stackBlock = payload.stack
        ? `<pre style="background:#f5f5f7;padding:8px;border-radius:4px;font-size:11px;overflow-x:auto;">${escapeHtml(payload.stack)}</pre>`
        : ''
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Kær <onboarding@resend.dev>',
          to: recipients,
          subject: `[Kær app-error] ${payload.kind} · ${payload.route ?? '?'}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
            <h2 style="font-size:18px;">Erreur applicative</h2>
            <p style="color:#555;">Télémétrie technique, aucune donnée patient.</p>
            <table style="font-size:13px;border-collapse:collapse;">${rows}</table>
            ${stackBlock}
            <p style="color:#888;font-size:12px;margin-top:16px;">Signature : <code>${signature}</code><br/>
            Les occurrences suivantes de cette signature n'enverront pas d'email (déduplication + cooldown).</p>
          </div>`,
        }),
      })
      if (!res.ok) console.error('Erreur Resend (app-error):', await res.text())
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = validatePayload(await req.json())
    if (!payload) return json({ error: 'invalid_payload' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const result = await runReport(makeStore(supabase), makeMailer(), payload, {
      now: new Date(),
      cooldownMs: COOLDOWN_MS,
      circuitMax: CIRCUIT_MAX,
      circuitWindowMs: CIRCUIT_WINDOW_MS,
    })

    if (!result.ok) {
      console.error('runReport a échoué:', result.error)
      return json({ error: 'report_failed' }, 500)
    }
    return json({ success: true, created: result.created, emailed: result.emailed }, 200)
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return json({ error: 'server_error' }, 500)
  }
})
