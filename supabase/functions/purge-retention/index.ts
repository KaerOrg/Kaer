import { createClient } from 'jsr:@supabase/supabase-js@2'

// #28 — Politique de conservation RGPD (art. 5.1.e — limitation de la conservation).
//
// Purge programmée : supprime les lignes dont l'ancienneté dépasse la durée définie
// dans `retention_config`. Déclenchée quotidiennement par pg_cron (cf. schema.sql).
//
// ⚠️ MDR (RÈGLE D'OR) : la sélection repose UNIQUEMENT sur des dates — ancienneté de
// la donnée et, pour les données de santé, inactivité du patient. Aucun score, aucune
// valeur clinique n'entre dans le critère. Règle de calendrier pure.
//
// Architecture : la logique de sélection (calcul des coupures + jointure d'inactivité)
// vit dans la fonction SQL `purge_retention_table` (SECURITY DEFINER, ensembliste,
// scalable). Cette Edge Function est un simple ORCHESTRATEUR : elle lit la config,
// appelle le RPC par table, puis trace chaque purge dans le journal d'audit.
//
// Sécurité : exécutée en service_role (seul moyen de purger des données patient,
// la RLS bloquant la suppression de masse). L'appelant DOIT présenter la clé
// service_role — un patient/praticien authentifié ne peut pas déclencher la purge.

interface RetentionConfigRow {
  table_name: string
  date_column: string
  retention_days: number
  gate_on_inactivity: boolean
  inactivity_days: number
}

interface PurgeOutcome {
  table: string
  deleted: number
  error?: string
}

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

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Garde : seul un appelant porteur de la clé service_role peut déclencher la purge.
  const bearer = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (bearer !== serviceRoleKey) {
    return json({ error: 'forbidden' }, 403)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)

  // Règles de conservation actives.
  const { data: configs, error: configErr } = await supabase
    .from('retention_config')
    .select('table_name, date_column, retention_days, gate_on_inactivity, inactivity_days')
    .eq('is_enabled', true)

  if (configErr) {
    console.error('purge-retention: lecture retention_config échouée:', configErr)
    return json({ error: 'config_read_failed' }, 500)
  }

  const outcomes: PurgeOutcome[] = []

  for (const config of (configs ?? []) as RetentionConfigRow[]) {
    // La sélection + suppression ensembliste est déléguée à la fonction SQL.
    const { data: deleted, error: purgeErr } = await supabase.rpc('purge_retention_table', {
      p_table: config.table_name,
      p_date_column: config.date_column,
      p_retention_days: config.retention_days,
      p_gate_inactivity: config.gate_on_inactivity,
      p_inactivity_days: config.inactivity_days,
    })

    if (purgeErr) {
      console.error(`purge-retention: purge ${config.table_name} échouée:`, purgeErr)
      outcomes.push({ table: config.table_name, deleted: 0, error: purgeErr.message })
      continue
    }

    const deletedCount = typeof deleted === 'number' ? deleted : 0
    outcomes.push({ table: config.table_name, deleted: deletedCount })

    // Traçabilité : journaliser la purge (métadonnées techniques uniquement).
    // Une purge à 0 ligne est aussi tracée : preuve que la règle s'est exécutée.
    const { error: auditErr } = await supabase.rpc('log_data_access', {
      p_action: 'purge',
      p_target_table: config.table_name,
      p_target_id: null,
      p_patient_id: null,
      p_metadata: {
        deleted_count: deletedCount,
        retention_days: config.retention_days,
        gate_on_inactivity: config.gate_on_inactivity,
        inactivity_days: config.inactivity_days,
      },
    })
    if (auditErr) {
      console.error(`purge-retention: audit ${config.table_name} échoué:`, auditErr)
    }
  }

  return json({ ok: true, purged: outcomes }, 200)
})
