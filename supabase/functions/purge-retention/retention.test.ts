// #28 — Tests de la logique d'orchestration de la purge de conservation.
//
// Couvre la part testable sans Postgres : garde d'autorisation, mapping des arguments
// RPC, et orchestration (`runPurge`) via un faux `RetentionStore` enregistreur.
// La sélection ensembliste SQL elle-même (coupures temporelles + jointure d'inactivité)
// vit dans `purge_retention_table` / `fn_inactive_patient_ids` et relève d'un test
// d'intégration Postgres (cf. docs/retention-conservation.md, section Tests).
//
// Exécution : `deno test supabase/functions/purge-retention/` (job CI « Edge — Tests »).

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@1'
import {
  type AuditArgs,
  buildAuditArgs,
  buildPurgeArgs,
  isAuthorized,
  type PurgeArgs,
  type RetentionConfigRow,
  type RetentionStore,
  runPurge,
} from './retention.ts'

const GATED: RetentionConfigRow = {
  table_name: 'patient_entries',
  date_column: 'created_at',
  retention_days: 1825,
  gate_on_inactivity: true,
  inactivity_days: 365,
}

const UNGATED: RetentionConfigRow = {
  table_name: 'notification_logs',
  date_column: 'created_at',
  retention_days: 365,
  gate_on_inactivity: false,
  inactivity_days: 365,
}

// --- Faux store enregistreur ------------------------------------------------

interface RecordingStore extends RetentionStore {
  purgeCalls: PurgeArgs[]
  auditCalls: AuditArgs[]
}

interface FakeStoreOptions {
  configs?: RetentionConfigRow[]
  configError?: string
  /** Réponse de purge par nom de table : nombre supprimé, ou message d'erreur. */
  purgeByTable?: Record<string, { deleted: number } | { error: string }>
  /** Tables dont l'audit doit échouer. */
  auditErrorTables?: Set<string>
}

function makeStore(opts: FakeStoreOptions = {}): RecordingStore {
  const purgeCalls: PurgeArgs[] = []
  const auditCalls: AuditArgs[] = []
  return {
    purgeCalls,
    auditCalls,
    listEnabledConfigs: () =>
      Promise.resolve(
        opts.configError
          ? { data: null, error: { message: opts.configError } }
          : { data: opts.configs ?? [], error: null },
      ),
    purgeTable: (args: PurgeArgs) => {
      purgeCalls.push(args)
      const resp = opts.purgeByTable?.[args.p_table]
      if (resp && 'error' in resp) {
        return Promise.resolve({ data: null, error: { message: resp.error } })
      }
      const deleted = resp && 'deleted' in resp ? resp.deleted : 0
      return Promise.resolve({ data: deleted, error: null })
    },
    logAudit: (args: AuditArgs) => {
      auditCalls.push(args)
      const fail = opts.auditErrorTables?.has(args.p_target_table)
      return Promise.resolve({ error: fail ? { message: 'audit down' } : null })
    },
  }
}

// --- isAuthorized -----------------------------------------------------------

Deno.test('isAuthorized accepte la clé service_role avec préfixe Bearer', () => {
  assert(isAuthorized('Bearer secret-key', 'secret-key'))
})

Deno.test('isAuthorized rejette une mauvaise clé', () => {
  assertFalse(isAuthorized('Bearer wrong', 'secret-key'))
})

Deno.test('isAuthorized rejette un en-tête absent', () => {
  assertFalse(isAuthorized(null, 'secret-key'))
})

Deno.test('isAuthorized rejette un bearer vide même si la clé est vide', () => {
  // Garde-fou : un service_role mal configuré (clé vide) ne doit pas ouvrir la porte.
  assertFalse(isAuthorized('Bearer ', ''))
})

// --- buildPurgeArgs ---------------------------------------------------------

Deno.test('buildPurgeArgs mappe une règle gatée vers les paramètres RPC', () => {
  assertEquals(buildPurgeArgs(GATED), {
    p_table: 'patient_entries',
    p_date_column: 'created_at',
    p_retention_days: 1825,
    p_gate_inactivity: true,
    p_inactivity_days: 365,
  })
})

Deno.test('buildPurgeArgs conserve gate_on_inactivity=false pour une règle non gatée', () => {
  assertEquals(buildPurgeArgs(UNGATED).p_gate_inactivity, false)
})

// --- buildAuditArgs ---------------------------------------------------------

Deno.test('buildAuditArgs trace les métadonnées techniques, sans donnée clinique', () => {
  assertEquals(buildAuditArgs(GATED, 12), {
    p_action: 'purge',
    p_target_table: 'patient_entries',
    p_target_id: null,
    p_patient_id: null,
    p_metadata: {
      deleted_count: 12,
      retention_days: 1825,
      gate_on_inactivity: true,
      inactivity_days: 365,
    },
  })
})

Deno.test('buildAuditArgs trace aussi une purge à 0 ligne', () => {
  assertEquals(buildAuditArgs(UNGATED, 0).p_metadata.deleted_count, 0)
})

// --- runPurge ---------------------------------------------------------------

Deno.test('runPurge remonte configError et ne purge rien si la lecture config échoue', async () => {
  const store = makeStore({ configError: 'boom' })
  const result = await runPurge(store)
  assert(result.configError)
  assertEquals(result.outcomes, [])
  assertEquals(store.purgeCalls.length, 0)
  assertEquals(store.auditCalls.length, 0)
})

Deno.test('runPurge purge chaque table active et trace chaque purge', async () => {
  const store = makeStore({
    configs: [GATED, UNGATED],
    purgeByTable: {
      patient_entries: { deleted: 4 },
      notification_logs: { deleted: 9 },
    },
  })
  const result = await runPurge(store)

  assertFalse(result.configError)
  assertEquals(result.outcomes, [
    { table: 'patient_entries', deleted: 4 },
    { table: 'notification_logs', deleted: 9 },
  ])
  assertEquals(store.purgeCalls.map((c) => c.p_table), ['patient_entries', 'notification_logs'])
  assertEquals(store.auditCalls.map((c) => c.p_target_table), ['patient_entries', 'notification_logs'])
  assertEquals(store.auditCalls[0].p_metadata.deleted_count, 4)
})

Deno.test('runPurge trace une purge à 0 ligne (preuve d\'exécution)', async () => {
  const store = makeStore({ configs: [UNGATED], purgeByTable: { notification_logs: { deleted: 0 } } })
  const result = await runPurge(store)

  assertEquals(result.outcomes, [{ table: 'notification_logs', deleted: 0 }])
  assertEquals(store.auditCalls.length, 1)
  assertEquals(store.auditCalls[0].p_metadata.deleted_count, 0)
})

Deno.test('runPurge isole l\'échec d\'une table sans bloquer les suivantes', async () => {
  const store = makeStore({
    configs: [GATED, UNGATED],
    purgeByTable: {
      patient_entries: { error: 'lock timeout' },
      notification_logs: { deleted: 3 },
    },
  })
  const result = await runPurge(store)

  assertEquals(result.outcomes, [
    { table: 'patient_entries', deleted: 0, error: 'lock timeout' },
    { table: 'notification_logs', deleted: 3 },
  ])
  // La table en échec n'est pas auditée ; la suivante l'est.
  assertEquals(store.auditCalls.map((c) => c.p_target_table), ['notification_logs'])
})

Deno.test('runPurge n\'échoue pas si la trace d\'audit échoue', async () => {
  const store = makeStore({
    configs: [UNGATED],
    purgeByTable: { notification_logs: { deleted: 5 } },
    auditErrorTables: new Set(['notification_logs']),
  })
  const result = await runPurge(store)

  // La purge a bien eu lieu et est reportée, malgré l'échec d'audit.
  assertFalse(result.configError)
  assertEquals(result.outcomes, [{ table: 'notification_logs', deleted: 5 }])
})
