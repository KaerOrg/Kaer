// #28 — Logique d'orchestration de la purge de conservation (RGPD art. 5.1.e).
//
// Ce module isole la partie TESTABLE de la purge, séparée de l'enveloppe Deno
// (`index.ts`) et de tout accès réseau : garde d'autorisation, construction des
// arguments RPC, et boucle d'orchestration. L'accès aux données est injecté via
// l'interface `RetentionStore` → on teste l'orchestration avec un faux store,
// sans Supabase ni Postgres.
//
// ⚠️ MDR (RÈGLE D'OR) : la SÉLECTION des lignes (calcul des coupures temporelles +
// jointure d'inactivité) reste 100 % en SQL (`purge_retention_table` /
// `fn_inactive_patient_ids`, voir schema.sql) — critère purement temporel, aucune
// valeur clinique. Ce module n'évalue jamais le contenu d'une donnée : il route des
// règles de config vers le RPC SQL et trace le résultat.

export interface RetentionConfigRow {
  table_name: string
  date_column: string
  retention_days: number
  gate_on_inactivity: boolean
  inactivity_days: number
}

export interface PurgeOutcome {
  table: string
  deleted: number
  error?: string
}

/** Arguments du RPC SQL `purge_retention_table` (paramètres liés, identifiants issus de la config). */
export interface PurgeArgs {
  p_table: string
  p_date_column: string
  p_retention_days: number
  p_gate_inactivity: boolean
  p_inactivity_days: number
}

/** Arguments du RPC SQL `log_data_access` — métadonnées techniques de la purge uniquement. */
export interface AuditArgs {
  p_action: 'purge'
  p_target_table: string
  p_target_id: null
  p_patient_id: null
  p_metadata: {
    deleted_count: number
    retention_days: number
    gate_on_inactivity: boolean
    inactivity_days: number
  }
}

interface RpcResult<T> {
  data: T | null
  error: { message: string } | null
}

/**
 * Accès données injectable. L'implémentation réelle (`index.ts`) l'adosse au client
 * Supabase service_role ; les tests passent un faux store enregistreur.
 */
export interface RetentionStore {
  listEnabledConfigs(): Promise<RpcResult<RetentionConfigRow[]>>
  purgeTable(args: PurgeArgs): Promise<RpcResult<number>>
  logAudit(args: AuditArgs): Promise<{ error: { message: string } | null }>
}

/** Résultat de l'orchestration : les issues par table + un drapeau d'échec de lecture config. */
export interface PurgeRun {
  outcomes: PurgeOutcome[]
  configError: boolean
}

/**
 * Garde d'autorisation : seul un appelant porteur de la clé service_role peut
 * déclencher la purge (un patient/praticien authentifié ne le peut pas).
 */
export function isAuthorized(authHeader: string | null, serviceRoleKey: string): boolean {
  const bearer = (authHeader ?? '').replace('Bearer ', '')
  return bearer.length > 0 && bearer === serviceRoleKey
}

/** Mappe une règle de conservation vers les arguments du RPC de purge SQL. */
export function buildPurgeArgs(config: RetentionConfigRow): PurgeArgs {
  return {
    p_table: config.table_name,
    p_date_column: config.date_column,
    p_retention_days: config.retention_days,
    p_gate_inactivity: config.gate_on_inactivity,
    p_inactivity_days: config.inactivity_days,
  }
}

/**
 * Construit l'entrée d'audit d'une purge. Une purge à 0 ligne est tracée aussi :
 * preuve que la règle s'est bien exécutée à la date prévue.
 */
export function buildAuditArgs(config: RetentionConfigRow, deletedCount: number): AuditArgs {
  return {
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
  }
}

/**
 * Orchestration : lit les règles actives, applique la purge SQL par table, trace
 * chaque purge. Isolation d'erreur : l'échec d'une table n'interrompt pas les autres ;
 * un échec d'audit est journalisé sans faire échouer la purge déjà effectuée.
 */
export async function runPurge(store: RetentionStore): Promise<PurgeRun> {
  const { data: configs, error: configErr } = await store.listEnabledConfigs()
  if (configErr) {
    console.error('purge-retention: lecture retention_config échouée:', configErr)
    return { outcomes: [], configError: true }
  }

  const outcomes: PurgeOutcome[] = []

  for (const config of configs ?? []) {
    const { data: deleted, error: purgeErr } = await store.purgeTable(buildPurgeArgs(config))

    if (purgeErr) {
      console.error(`purge-retention: purge ${config.table_name} échouée:`, purgeErr)
      outcomes.push({ table: config.table_name, deleted: 0, error: purgeErr.message })
      continue
    }

    const deletedCount = typeof deleted === 'number' ? deleted : 0
    outcomes.push({ table: config.table_name, deleted: deletedCount })

    const { error: auditErr } = await store.logAudit(buildAuditArgs(config, deletedCount))
    if (auditErr) {
      console.error(`purge-retention: audit ${config.table_name} échoué:`, auditErr)
    }
  }

  return { outcomes, configError: false }
}
