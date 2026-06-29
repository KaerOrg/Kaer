// #90 — Edge Function `report-render-mismatch`.
//
// Reçoit un non-match du moteur de rendu (config preview_kind / field_type /
// widget_type / text_code qu'une app ne sait pas afficher), le persiste dans
// `render_mismatch_log` (dédup par signature) et notifie l'équipe par email (Resend)
// à la 1ʳᵉ occurrence d'une signature, sous cooldown + coupe-circuit global.
//
// ⚠️ MDR / RGPD : télémétrie TECHNIQUE. Aucune donnée patient (validatePayload ne
// reconstruit que des champs de config — tout extra est ignoré).
//
// La logique pure (validation, signature, dédup/cooldown/coupe-circuit) vit dans
// `logic.ts` et est testée sans Postgres ni Resend.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import {
  type Mailer,
  type MismatchStore,
  type RenderMismatchPayload,
  runReport,
  validatePayload,
} from './logic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Réglages anti-flood (surchargeable par env, sans redéploiement de la logique).
const COOLDOWN_MS = Number(Deno.env.get('RENDER_MISMATCH_COOLDOWN_MS') ?? 24 * 60 * 60 * 1000)
const CIRCUIT_MAX = Number(Deno.env.get('RENDER_MISMATCH_CIRCUIT_MAX') ?? 20)
const CIRCUIT_WINDOW_MS = Number(Deno.env.get('RENDER_MISMATCH_CIRCUIT_WINDOW_MS') ?? 60 * 60 * 1000)

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function makeStore(supabase: SupabaseClient): MismatchStore {
  const table = () => supabase.from('render_mismatch_log')
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
  const recipients = (Deno.env.get('RENDER_MISMATCH_EMAIL') ?? Deno.env.get('DEV_EMAIL') ?? 'guillaume.zarb@gmail.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const resendKey = Deno.env.get('RESEND_API_KEY')

  return {
    async send(payload: RenderMismatchPayload, signature: string, occurrenceCount: number) {
      if (recipients.length === 0 || !resendKey) return
      const rows = [
        ['Plateforme', payload.platform],
        ['Version app', payload.app_version],
        ['Niveau', payload.level],
        ['module_id', payload.module_id ?? '—'],
        ['preview_kind', payload.preview_kind ?? '—'],
        ['field_id', payload.field_id ?? '—'],
        ['field_type', payload.field_type ?? '—'],
        ['widget_type', payload.widget_type ?? '—'],
        ['reason', payload.reason || '—'],
        ['Occurrences', String(occurrenceCount)],
      ]
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#888;">${k}</td><td style="padding:4px 0;"><code>${v}</code></td></tr>`,
        )
        .join('')
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Kær <onboarding@resend.dev>',
          to: recipients,
          subject: `[Kær render-mismatch] ${payload.level} · ${payload.module_id ?? '?'}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
            <h2 style="font-size:18px;">Non-match du moteur de rendu</h2>
            <p style="color:#555;">Une config n'a pas pu être affichée. Télémétrie technique, aucune donnée patient.</p>
            <table style="font-size:13px;border-collapse:collapse;">${rows}</table>
            <p style="color:#888;font-size:12px;margin-top:16px;">Signature : <code>${signature}</code><br/>
            Les occurrences suivantes de cette signature n'enverront pas d'email (déduplication + cooldown).</p>
          </div>`,
        }),
      })
      if (!res.ok) console.error('Erreur Resend (render-mismatch):', await res.text())
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
