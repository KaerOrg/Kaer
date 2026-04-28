import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { practitioner_id, patient_email, first_name, last_name, birth_date, sex, teen_mode, modules } = await req.json()

    if (!practitioner_id || !patient_email) {
      return new Response(
        JSON.stringify({ error: 'practitioner_id et patient_email sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!EMAIL_RE.test(patient_email.trim())) {
      return new Response(
        JSON.stringify({ error: 'Adresse email invalide.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client avec service_role pour insérer sans RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Vérifier que le praticien existe
    const { data: practitioner, error: practErr } = await supabase
      .from('practitioners')
      .select('id, name')
      .eq('id', practitioner_id)
      .single()

    if (practErr || !practitioner) {
      return new Response(
        JSON.stringify({ error: 'Praticien introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = patient_email.toLowerCase().trim()

    // Vérifications de doublon en parallèle
    const [{ data: existingPatient }, { data: pendingInvite }] = await Promise.all([
      // Patient déjà inscrit et lié à ce praticien
      supabase
        .from('patients')
        .select('id, practitioner_patients!inner(patient_id)')
        .eq('email', normalizedEmail)
        .eq('practitioner_patients.practitioner_id', practitioner_id)
        .maybeSingle(),
      // Invitation en cours non expirée pour ce praticien + cet email
      supabase
        .from('invitations')
        .select('id')
        .eq('practitioner_id', practitioner_id)
        .eq('patient_email', normalizedEmail)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle(),
    ])

    if (existingPatient) {
      return new Response(
        JSON.stringify({ error: 'patient_already_registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (pendingInvite) {
      return new Response(
        JSON.stringify({ error: 'invitation_already_pending' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer le token et créer l'invitation
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('invitations').insert({
      practitioner_id,
      patient_email: normalizedEmail,
      patient_first_name: first_name?.trim() || null,
      patient_last_name: last_name?.trim() || null,
      patient_birth_date: birth_date || null,
      patient_sex: sex || null,
      teen_mode: teen_mode === true,
      pre_selected_modules: Array.isArray(modules) ? modules : [],
      token,
      expires_at: expiresAt,
    })

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Cet email a déjà une invitation en cours.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construire le lien d'inscription
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000'
    const registrationLink = `${siteUrl}/register?token=${token}`

    // Envoyer l'email via Resend
    const practitionerName = practitioner.name || 'Votre praticien'
    // En mode développement, on envoie au praticien lui-même
    // (Resend gratuit sans domaine vérifié ne peut envoyer qu'à l'email du compte Resend)
    const recipientEmail = Deno.env.get('DEV_EMAIL') ?? normalizedEmail

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PsyTool <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `[TEST] Invitation pour ${patient_email} — ${practitionerName} vous invite sur PsyTool`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
            <div style="text-align: center; padding: 32px 0 16px;">
              <h1 style="margin: 8px 0 0; font-size: 24px; color: #4F46E5;">PsyTool</h1>
            </div>
            <div style="background: #f8f9ff; border-radius: 12px; padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 18px;">Vous avez été invité(e)</h2>
              <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                <strong>${practitionerName}</strong> vous invite à rejoindre PsyTool,
                votre espace d'outils thérapeutiques personnels.
              </p>
              <p style="margin: 0 0 8px; color: #444; line-height: 1.6;">
                Ouvrez l'app PsyTool sur votre téléphone, appuyez sur
                <strong>« J'ai une invitation »</strong> et saisissez ce code :
              </p>
              <div style="background: #fff; border: 2px solid #4F46E5; border-radius: 8px;
                          padding: 16px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                  Votre code d'invitation
                </p>
                <p style="margin: 0; font-family: monospace; font-size: 15px;
                           color: #4F46E5; font-weight: 700; word-break: break-all;">
                  ${token}
                </p>
              </div>
              <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
                Ou créez votre compte directement depuis un navigateur web :
              </p>
              <div style="text-align: center; margin-bottom: 16px;">
                <a href="${registrationLink}"
                   style="display: inline-block; background: #4F46E5; color: white;
                          padding: 12px 28px; border-radius: 8px; text-decoration: none;
                          font-weight: 600; font-size: 15px;">
                  Créer mon compte (web)
                </a>
              </div>
              <p style="margin: 16px 0 0; font-size: 12px; color: #aaa; text-align: center;">
                Ce code est valable <strong>48 heures</strong>.
              </p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 24px;">
              PsyTool — Outil d'accompagnement thérapeutique
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text()
      console.error('Erreur Resend:', emailError)
      return new Response(
        JSON.stringify({ error: "L'invitation a été créée mais l'email n'a pas pu être envoyé." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, token }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erreur inattendue:', err)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur inattendue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
