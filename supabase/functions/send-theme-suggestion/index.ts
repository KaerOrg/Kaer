import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUGGESTION_MAX = 1000
const RATE_LIMIT_PER_HOUR = 10

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { suggestion } = await req.json()

    if (typeof suggestion !== 'string' || suggestion.trim().length === 0) {
      return json({ error: 'suggestion_required' }, 400)
    }
    const cleanSuggestion = suggestion.trim().slice(0, SUGGESTION_MAX)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Identité dérivée du JWT — la suggestion est réservée aux praticiens connectés.
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    if (!jwt) return json({ error: 'unauthorized' }, 401)
    const { data: userData } = await supabase.auth.getUser(jwt)
    const user = userData?.user
    if (!user) return json({ error: 'unauthorized' }, 401)

    const { data: practitioner } = await supabase
      .from('practitioners')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()
    const practitionerName = practitioner?.name || '(nom non renseigné)'

    // Rate-limit par IP (hash, jamais l'IP en clair).
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    const ipHash = await sha256(ip)
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('theme_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', sinceIso)
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return json({ error: 'rate_limited' }, 429)
    }

    // 1) Enregistrer la suggestion (service_role → bypass RLS).
    const { error: insertError } = await supabase.from('theme_suggestions').insert({
      practitioner_id: user.id,
      suggestion: cleanSuggestion,
      ip_hash: ipHash,
    })
    if (insertError) {
      console.error('Erreur insert theme_suggestions:', insertError)
      return json({ error: 'insert_failed' }, 500)
    }

    // 2) Notifier l'équipe éditoriale par email (Resend) — best-effort.
    const recipients = (Deno.env.get('SUPPORT_EMAIL') ?? Deno.env.get('DEV_EMAIL') ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (recipients.length > 0 && resendKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kær <onboarding@resend.dev>',
          to: recipients,
          subject: '[Kær] Suggestion de fiche psychoéducation',
          html: `<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;"><h2 style="font-size: 18px;">Nouvelle suggestion de fiche</h2><p><strong>Praticien :</strong> ${escapeHtml(practitionerName)} (${user.id})</p><p><strong>Email :</strong> ${escapeHtml(user.email ?? '(non renseigné)')}</p><p><strong>Suggestion :</strong></p><p style="white-space: pre-wrap; background:#f4f4f8; padding:12px; border-radius:8px;">${escapeHtml(cleanSuggestion)}</p><p style="color:#888; font-size:12px;">Enregistrée dans theme_suggestions.</p></div>`,
        }),
      })
      if (!emailResponse.ok) {
        console.error('Erreur Resend (suggestion):', await emailResponse.text())
      }
    }

    return json({ success: true }, 200)
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return json({ error: 'server_error' }, 500)
  }
})
