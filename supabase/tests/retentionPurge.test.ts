// #38 — Tests d'intégration SQL de la sélection de purge de conservation (#28).
//
// Couvre la part qui ne pouvait PAS l'être par les tests d'orchestration Deno
// (`functions/purge-retention/retention.test.ts`) : la SÉLECTION ensembliste elle-même,
// qui vit en SQL (`fn_inactive_patient_ids` + `purge_retention_table`, schema.sql).
//
// Harnais : pglite (vrai Postgres compilé en WASM) — aucun Docker ni service container,
// tourne avec la toolchain Deno déjà en CI. Les fonctions testées sont chargées TELLES
// QUELLES depuis schema.sql (cf. schemaFunctions.ts) : zéro duplication, dérive détectée.
// Seules les tables sont des fixtures minimales (scaffolding, pas la logique testée).
//
// ⚠️ MDR (RÈGLE D'OR) : le critère de purge est 100 % temporel (ancienneté de la donnée
// + inactivité du patient = dates de connexion et de RDV). Aucune valeur clinique n'entre
// dans la sélection — ces tests n'introduisent donc aucun seuil ni jugement.
//
// Exécution : `deno test --allow-read --allow-env --no-lock --node-modules-dir=none supabase/tests/`
// (job CI « SQL — Tests »).

import { assertEquals } from 'jsr:@std/assert@1'
import { PGlite } from 'npm:@electric-sql/pglite@0.5.3'
import { loadFunctions, readSchema } from './schemaFunctions.ts'

const SCHEMA = await readSchema()

const RETENTION_DAYS = 1825 // 5 ans (durée gatée patient_entries dans seed.sql)
const INACTIVITY_DAYS = 365

/** Base de test : tables minimales + fonctions de sélection réelles extraites du schéma. */
async function makeDb(): Promise<PGlite> {
  const db = new PGlite()
  // Fixtures : uniquement les colonnes lues par les fonctions de sélection.
  await db.exec(`
    create schema if not exists auth;
    create table auth.users (id uuid primary key, last_sign_in_at timestamptz);
    create table public.patients (id uuid primary key);
    create table public.appointments (id uuid primary key, patient_id uuid, starts_at timestamptz);
    create table public.patient_entries (patient_id uuid, client_created_at timestamptz);
    create table public.notification_logs (sent_at timestamptz);
  `)
  await loadFunctions(db, SCHEMA, ['public.fn_inactive_patient_ids', 'public.purge_retention_table'])
  return db
}

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

/**
 * Exécuteur de requêtes minimal — satisfait par `PGlite` comme par l'objet de
 * transaction passé à `db.transaction(...)`, donc les helpers ci-dessous servent
 * indifféremment hors et dans une transaction (cf. test de la coupure stricte).
 */
interface Queryer {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
}

/** Insère un patient et son enregistrement `auth.users` ; RDV optionnel. */
async function insertPatient(
  db: Queryer,
  opts: { lastSignIn?: string | null; appointmentAt?: string } = {},
): Promise<string> {
  const id = crypto.randomUUID()
  await db.query('insert into public.patients(id) values ($1)', [id])
  await db.query('insert into auth.users(id, last_sign_in_at) values ($1, $2)', [id, opts.lastSignIn ?? null])
  if (opts.appointmentAt) {
    await db.query(
      'insert into public.appointments(id, patient_id, starts_at) values ($1, $2, $3)',
      [crypto.randomUUID(), id, opts.appointmentAt],
    )
  }
  return id
}

function insertEntry(db: Queryer, patientId: string, ageDays: number): Promise<unknown> {
  return db.query(
    'insert into public.patient_entries(patient_id, client_created_at) values ($1, now() - make_interval(days => $2))',
    [patientId, ageDays],
  )
}

/** Lance la purge gatée de `patient_entries` (table protégée par inactivité). */
function purgeGated(db: Queryer): Promise<number> {
  return db
    .query<{ n: number }>(
      "select public.purge_retention_table('patient_entries', 'client_created_at', $1, true, $2) as n",
      [RETENTION_DAYS, INACTIVITY_DAYS],
    )
    .then((r) => r.rows[0].n)
}

function countEntries(db: PGlite): Promise<number> {
  return db.query<{ n: number }>('select count(*)::int n from public.patient_entries').then((r) => r.rows[0].n)
}

// --- Cas d'acceptation #38 ---------------------------------------------------

Deno.test('donnée < durée de conservation → NON purgée', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db) // inactif (jamais connecté, aucun RDV)
  await insertEntry(db, patient, 100) // récente, sous le seuil de 1825 j
  assertEquals(await purgeGated(db), 0)
  assertEquals(await countEntries(db), 1)
  await db.close()
})

Deno.test('donnée > durée mais patient ACTIF (connexion récente) → NON purgée', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db, { lastSignIn: daysAgoIso(10) })
  await insertEntry(db, patient, 2000) // ancienne, mais patient protégé
  assertEquals(await purgeGated(db), 0)
  assertEquals(await countEntries(db), 1)
  await db.close()
})

Deno.test('donnée > durée mais patient ACTIF (RDV récent) → NON purgée', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db, { lastSignIn: daysAgoIso(500), appointmentAt: daysAgoIso(10) })
  await insertEntry(db, patient, 2000)
  assertEquals(await purgeGated(db), 0)
  await db.close()
})

Deno.test('donnée > durée ET patient INACTIF → purgée', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db, { lastSignIn: daysAgoIso(500) }) // > 365 j → inactif
  await insertEntry(db, patient, 2000)
  assertEquals(await purgeGated(db), 1)
  assertEquals(await countEntries(db), 0)
  await db.close()
})

Deno.test('patient jamais connecté (last_sign_in_at null) → inactif côté connexion → purgée', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db, { lastSignIn: null })
  await insertEntry(db, patient, 2000)
  assertEquals(await purgeGated(db), 1)
  await db.close()
})

Deno.test('ligne exactement à la coupure → conservée (strict <)', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db, { lastSignIn: null })
  // Transaction → now() (transaction_timestamp) stable : la ligne est datée PILE à la
  // coupure calculée par la fonction (now() - 1825 j). Le `<` strict doit la conserver.
  await db.transaction(async (tx) => {
    await insertEntry(tx, patient, RETENTION_DAYS)
    assertEquals(await purgeGated(tx), 0)
  })
  assertEquals(await countEntries(db), 1)
  await db.close()
})

Deno.test('table non gatée → purge par simple ancienneté (patient actif inclus)', async () => {
  const db = await makeDb()
  // Aucun gating : la table n'a même pas de colonne patient_id. Seule l'ancienneté compte.
  await db.query('insert into public.notification_logs(sent_at) values (now() - make_interval(days => 400))')
  await db.query('insert into public.notification_logs(sent_at) values (now() - make_interval(days => 10))')
  const r = await db.query<{ n: number }>(
    "select public.purge_retention_table('notification_logs', 'sent_at', 365, false, 365) as n",
  )
  assertEquals(r.rows[0].n, 1) // la ligne de 400 j part, celle de 10 j reste
  const remaining = await db.query<{ n: number }>('select count(*)::int n from public.notification_logs')
  assertEquals(remaining.rows[0].n, 1)
  await db.close()
})

Deno.test('idempotence : 2e run ne supprime plus rien', async () => {
  const db = await makeDb()
  const patient = await insertPatient(db, { lastSignIn: null })
  await insertEntry(db, patient, 2000)
  assertEquals(await purgeGated(db), 1)
  assertEquals(await purgeGated(db), 0) // idempotent
  await db.close()
})
