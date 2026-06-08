import { createClient } from 'jsr:@supabase/supabase-js@2'

// #27 — Effacement RGPD (droit à l'oubli, art. 17), suppression du COMPTE patient.
//
// Un RPC SQL ne peut pas supprimer une ligne auth.users → cette Edge Function le fait
// avec le service_role. La suppression du compte cascade (ON DELETE CASCADE) :
//   auth.users → patients → patient_entries, patient_modules, ... (~20 tables enfant).
// Le non-cascadant (invitations par email, caseload_entries en SET NULL) est nettoyé
// EN AMONT par le RPC erase_patient_data, appelé par le client juste avant cette fonction.
//
// Sécurité : l'appelant est authentifié (JWT). Habilités à supprimer un compte :
// un praticien ADMIN (practitioners.is_admin, page de gestion des utilisateurs) OU
// le PATIENT lui-même (self-service RGPD mobile). Identité dérivée du JWT, jamais du
// payload. Le service_role ne sert qu'à l'opération de suppression, jamais à élargir
// les droits de l'appelant. Cohérent avec les RPC erase_patient_data / export_patient_data.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { patient_id: patientId } = await req.json()
    if (typeof patientId !== 'string' || patientId.length === 0) {
      return json({ error: 'missing_patient_id' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Identité de l'appelant dérivée du JWT (jamais du payload).
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    if (!jwt) {
      return json({ error: 'unauthenticated' }, 401)
    }
    const { data: userData } = await supabase.auth.getUser(jwt)
    const callerId = userData?.user?.id
    if (!callerId) {
      return json({ error: 'unauthenticated' }, 401)
    }

    // Habilitation : le patient lui-même (self-service mobile) OU un praticien admin
    // (gestion des utilisateurs). Le rôle admin est lu en base via l'id du JWT — un
    // patient n'a pas de ligne practitioners, donc ne peut jamais devenir admin.
    let authorized = callerId === patientId
    if (!authorized) {
      const { data: caller } = await supabase
        .from('practitioners')
        .select('is_admin')
        .eq('id', callerId)
        .maybeSingle()
      authorized = Boolean(caller?.is_admin)
    }
    if (!authorized) {
      return json({ error: 'forbidden' }, 403)
    }

    // Suppression du compte → cascade patients + tables enfant.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(patientId)
    // Idempotent : un compte déjà supprimé n'est pas une erreur.
    if (deleteError && !/not.*found/i.test(deleteError.message)) {
      console.error('Erreur deleteUser:', deleteError)
      return json({ error: 'delete_failed' }, 500)
    }

    return json({ ok: true }, 200)
  } catch (err: unknown) {
    console.error('delete-patient-account:', err)
    return json({ error: 'internal_error' }, 500)
  }
})
