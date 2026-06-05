import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Motifs autorisés — liste fermée (le formulaire est borné, aucune saisie libre).
const ALLOWED_REASONS = ['mfa_lost', 'login_issue', 'account_issue', 'other']
const REASON_LABELS: Record<string, string> = {
  mfa_lost: "Perte d'accès à l'application d'authentification (2FA)",
  login_issue: 'Problème de connexion',
  account_issue: 'Problème lié au compte',
  other: 'Autre demande',
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_PER_HOUR = 5

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reason, email } = await req.json()

    if (!ALLOWED_REASONS.includes(reason)) {
      return json({ error: 'invalid_reason' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Identité dérivée du JWT si présent et valide (connecté, ou aal1 sur le challenge MFA).
    let userId: string | null = null
    let userEmail: string | null = null
    let practitionerName = '(non renseigné)'

    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    if (jwt) {
      const { data } = await supabase.auth.getUser(jwt)
      if (data?.user) {
        userId = data.user.id
        userEmail = data.user.email ?? null
        const { data: practitioner } = await supabase
          .from('practitioners')
          .select('name')
          .eq('id', userId)
          .maybeSingle()
        practitionerName = practitioner?.name || practitionerName
      }
    }

    // Anonyme (écran de login, non connecté) → email de contact obligatoire et valide.
    if (!userId) {
      if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
        return json({ error: 'invalid_email' }, 400)
      }
      userEmail = email.trim().toLowerCase()
    }

    // Rate-limit par IP (hash, jamais l'IP en clair).
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    const ipHash = await sha256(ip)
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', sinceIso)
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return json({ error: 'rate_limited' }, 429)
    }

    // 1) Enregistrer la demande (service_role → bypass RLS).
    const { error: insertError } = await supabase.from('support_requests').insert({
      practitioner_id: userId,
      email: userEmail,
      reason,
      ip_hash: ipHash,
    })
    if (insertError) {
      console.error('Erreur insert support_requests:', insertError)
      return json({ error: 'insert_failed' }, 500)
    }

    // 2) Notifier le support par email (Resend) — best-effort.
    const supportEmail = Deno.env.get('SUPPORT_EMAIL') ?? Deno.env.get('DEV_EMAIL') ?? null
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (supportEmail && resendKey) {
      const reasonLabel = REASON_LABELS[reason] ?? reason
      const origin = userId ? `Praticien : ${practitionerName} (${userId})` : 'Demande non authentifiée (écran de login)'
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PsyTool <onboarding@resend.dev>',
          to: [supportEmail],
          subject: `[Support PsyTool] ${reasonLabel}`,
          html: `<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;"><h2 style="font-size: 18px;">Nouvelle demande de support</h2><p><strong>Motif :</strong> ${reasonLabel}</p><p><strong>${origin}</strong></p><p><strong>Email de contact :</strong> ${userEmail ?? '—'}</p><p style="color:#888; font-size:12px;">Demande enregistrée dans support_requests. Vérifiez l'identité avant toute action (ex. réinitialisation 2FA).</p></div>`,
        }),
      })
      if (!emailResponse.ok) {
        console.error('Erreur Resend (support):', await emailResponse.text())
      }
    }

    return json({ success: true }, 200)
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return json({ error: 'server_error' }, 500)
  }
})
