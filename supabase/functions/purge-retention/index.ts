import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  type AuditArgs,
  isAuthorized,
  type PurgeArgs,
  type RetentionConfigRow,
  type RetentionStore,
  runPurge,
} from './retention.ts'

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
// scalable). L'orchestration (lire la config, appeler le RPC par table, tracer dans
// l'audit) vit dans `retention.ts` (pure, testable). Cette Edge Function n'est que
// l'enveloppe Deno : garde de sécurité, montage du store Supabase, réponse HTTP.
//
// Sécurité : exécutée en service_role (seul moyen de purger des données patient,
// la RLS bloquant la suppression de masse). L'appelant DOIT présenter la clé
// service_role — un patient/praticien authentifié ne peut pas déclencher la purge.

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
  if (!isAuthorized(req.headers.get('Authorization'), serviceRoleKey)) {
    return json({ error: 'forbidden' }, 403)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)

  // Store Supabase service_role : adosse l'interface testable au client réel.
  const store: RetentionStore = {
    listEnabledConfigs: () =>
      supabase
        .from('retention_config')
        .select('table_name, date_column, retention_days, gate_on_inactivity, inactivity_days')
        .eq('is_enabled', true)
        .returns<RetentionConfigRow[]>(),
    purgeTable: (args: PurgeArgs) => supabase.rpc('purge_retention_table', args),
    logAudit: (args: AuditArgs) => supabase.rpc('log_data_access', args),
  }

  const { outcomes, configError } = await runPurge(store)
  if (configError) {
    return json({ error: 'config_read_failed' }, 500)
  }

  return json({ ok: true, purged: outcomes }, 200)
})
