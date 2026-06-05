import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Motifs autorisés — liste fermée (le formulaire est borné, aucune saisie libre).
const ALLOWED_REASONS = ['mfa_lost', 'login_issue', 'account_issue', 'other'] as const
const REASON_LABELS: Record<string, string> = {
  mfa_lost: "Perte d'accès à l'application d'authentification (2FA)",
  login_issue: 'Problème de connexion',
  account_issue: 'Problème lié au compte',
  other: 'Autre demande',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reason } = await req.json()

    if (!ALLOWED_REASONS.includes(reason)) {
      return new Response(
        JSON.stringify({ error: 'invalid_reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Identité dérivée du JWT de l'appelant (valable en aal1, avant le challenge MFA).
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'unauthenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const user = userData?.user
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Nom du praticien (facultatif, pour l'email)
    const { data: practitioner } = await supabase
      .from('practitioners')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    // 1) Enregistrer la demande (service_role → bypass RLS)
    const { error: insertError } = await supabase.from('support_requests').insert({
      practitioner_id: user.id,
      email: user.email ?? null,
      reason,
    })
    if (insertError) {
      console.error('Erreur insert support_requests:', insertError)
      return new Response(
        JSON.stringify({ error: 'insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2) Notifier le support par email (Resend). Best-effort : la demande est déjà
    //    enregistrée ; un échec d'email ne doit pas invalider la demande.
    const supportEmail =
      Deno.env.get('SUPPORT_EMAIL') ?? Deno.env.get('DEV_EMAIL') ?? null
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (supportEmail && resendKey) {
      const reasonLabel = REASON_LABELS[reason] ?? reason
      const practitionerName = practitioner?.name || '(nom non renseigné)'
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
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
              <h2 style="font-size: 18px;">Nouvelle demande de support</h2>
              <p><strong>Motif :</strong> ${reasonLabel}</p>
              <p><strong>Praticien :</strong> ${practitionerName}</p>
              <p><strong>Email du compte :</strong> ${user.email ?? '—'}</p>
              <p><strong>ID praticien :</strong> ${user.id}</p>
              <p style="color:#888; font-size:12px;">
                Demande enregistrée dans support_requests. Vérifiez l'identité avant toute action
                (ex. réinitialisation 2FA).
              </p>
            </div>
          `,
        }),
      })
      if (!emailResponse.ok) {
        console.error('Erreur Resend (support):', await emailResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
