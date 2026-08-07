// #419. Tests d'intégration SQL de l'accusé de lecture d'une passation.
//
// Deux invariants tiennent tout le ticket, et aucun des deux n'est vérifiable depuis le
// client :
//   1. UN SEUL horodatage, celui de la première ouverture. Le patient n'a pas à savoir
//      combien de fois son praticien a rouvert sa passation.
//   2. Le patient ne peut PAS poser l'accusé lui-même. Il a un UPDATE plein sur ses
//      propres lignes (l'upsert de sync y retombe) : sans garde, il pourrait se voir
//      répondre « vu par votre soignant » alors que personne n'a rien ouvert. C'est un
//      mensonge dans un dossier de santé, pas un défaut cosmétique.
//
// Harnais : pglite (Postgres compilé en WASM), aucun Docker. Les fonctions testées sont
// chargées TELLES QUELLES depuis schema.sql (cf. schemaFunctions.ts) : zéro duplication,
// toute dérive entre le test et le schéma déployé est détectée. Seules les tables et
// `auth.uid()` sont des fixtures.
//
// ⚠️ MDR : rien ici ne lit une réponse. L'accusé est une date administrative, sans aucun
// lien avec le contenu de la passation.
//
// Exécution : `deno test --allow-read --allow-env --no-lock --node-modules-dir=none supabase/tests/`

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { PGlite } from 'npm:@electric-sql/pglite@0.5.3'
import { loadFunctions, readSchema } from './schemaFunctions.ts'

const SCHEMA = await readSchema()

const PATIENT = '11111111-1111-1111-1111-111111111111'
const PRACTITIONER = '22222222-2222-2222-2222-222222222222'
const OUTSIDER = '33333333-3333-3333-3333-333333333333'

/** Base de test : tables minimales, `auth.uid()` pilotable, fonctions réelles. */
async function makeDb(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(`
    create schema if not exists auth;
    -- Stub de l'acteur authentifié : Supabase le dérive du JWT, ici d'un GUC.
    create or replace function auth.uid() returns uuid language sql stable as $fn$
      select nullif(current_setting('test.uid', true), '')::uuid
    $fn$;

    create table public.practitioner_patients (
      practitioner_id uuid not null,
      patient_id      uuid not null
    );
    create table public.patient_entries (
      id                    serial primary key,
      patient_id            uuid not null,
      local_id              text not null,
      module_id             text not null,
      payload               jsonb not null default '{}'::jsonb,
      practitioner_read_at  timestamptz,
      unique (patient_id, local_id)
    );
    insert into public.practitioner_patients values ('${PRACTITIONER}', '${PATIENT}');
    insert into public.patient_entries (patient_id, local_id, module_id) values
      ('${PATIENT}', 'entry-1', 'phq9');
  `)
  await loadFunctions(db, SCHEMA, [
    'public.fn_guard_entry_read_receipt',
    'public.mark_entry_read',
  ])
  await db.exec(`
    create trigger trg_guard_entry_read_receipt
      before insert or update on public.patient_entries
      for each row execute function public.fn_guard_entry_read_receipt();
  `)
  return db
}

/** Bascule l'acteur authentifié ; `null` = service_role / migration (aucun auth.uid()). */
function actAs(db: PGlite, uid: string | null): Promise<unknown> {
  return db.query('select set_config($1, $2, false)', ['test.uid', uid ?? ''])
}

function markRead(db: PGlite): Promise<{ rows: { mark_entry_read: string | null }[] }> {
  return db.query<{ mark_entry_read: string | null }>(
    'select public.mark_entry_read($1, $2) as mark_entry_read',
    [PATIENT, 'entry-1'],
  )
}

function readReceipt(db: PGlite): Promise<{ rows: { practitioner_read_at: string | null }[] }> {
  return db.query<{ practitioner_read_at: string | null }>(
    'select practitioner_read_at from public.patient_entries where local_id = $1',
    ['entry-1'],
  )
}

async function assertRejected(fn: () => Promise<unknown>, expectedFragment: string): Promise<void> {
  let raised: unknown = null
  try {
    await fn()
  } catch (err: unknown) {
    raised = err
  }
  assert(raised !== null, 'l\'opération aurait dû être refusée')
  assert(String(raised).includes(expectedFragment), `message inattendu : ${String(raised)}`)
}

Deno.test('le praticien rattaché pose l\'accusé à l\'ouverture', async () => {
  const db = await makeDb()
  await actAs(db, PRACTITIONER)

  const { rows } = await markRead(db)
  assert(rows[0].mark_entry_read !== null, 'la date aurait dû être posée')

  await db.close()
})

Deno.test('l\'horodatage est celui de la PREMIÈRE ouverture, jamais réécrit', async () => {
  // Le cœur du ticket : rouvrir une passation ne doit pas déplacer la date. Sans le
  // `is null` du WHERE, le patient verrait sa ligne « Vu le … » avancer à chaque
  // consultation, ce qui revient à lui compter les visites de son praticien.
  const db = await makeDb()
  await actAs(db, PRACTITIONER)

  const first = (await markRead(db)).rows[0].mark_entry_read
  await db.query(`select pg_sleep(0.05)`)
  const second = (await markRead(db)).rows[0].mark_entry_read

  assertEquals(second, first)
  await db.close()
})

Deno.test('un praticien non rattaché ne peut pas poser l\'accusé', async () => {
  const db = await makeDb()
  await actAs(db, OUTSIDER)

  await assertRejected(() => markRead(db), 'non rattaché')
  assertEquals((await readReceipt(db)).rows[0].practitioner_read_at, null)

  await db.close()
})

Deno.test('le patient ne peut pas poser l\'accusé lui-même', async () => {
  // Il a un UPDATE plein sur ses propres lignes : la garde est la seule barrière.
  const db = await makeDb()
  await actAs(db, PATIENT)

  await assertRejected(
    () => db.query(`update public.patient_entries set practitioner_read_at = now() where local_id = 'entry-1'`),
    'ne peut pas être modifié par le patient',
  )
  assertEquals((await readReceipt(db)).rows[0].practitioner_read_at, null)

  await db.close()
})

Deno.test('le patient ne peut pas non plus l\'insérer d\'emblée', async () => {
  // Le chemin d'insertion est un chemin d'écriture comme un autre : l'upsert de sync
  // crée les lignes, il suffirait d'y glisser la colonne.
  const db = await makeDb()
  await actAs(db, PATIENT)

  await assertRejected(
    () => db.query(
      `insert into public.patient_entries (patient_id, local_id, module_id, practitioner_read_at)
       values ($1, 'entry-2', 'phq9', now())`,
      [PATIENT],
    ),
    'ne peut pas être posé par le patient',
  )

  await db.close()
})

Deno.test('la sync du patient continue de passer tant qu\'elle ne touche pas la colonne', async () => {
  // Régression à ne pas provoquer : la garde ne doit pas bloquer l'upsert normal, sinon
  // c'est toute la synchronisation des saisies qui tombe.
  const db = await makeDb()
  await actAs(db, PRACTITIONER)
  await markRead(db)

  await actAs(db, PATIENT)
  await db.query(
    `update public.patient_entries set payload = '{"answers":[1,2]}'::jsonb where local_id = 'entry-1'`,
  )
  await db.query(
    `insert into public.patient_entries (patient_id, local_id, module_id) values ($1, 'entry-3', 'phq9')`,
    [PATIENT],
  )

  const { rows } = await db.query<{ n: number }>('select count(*)::int as n from public.patient_entries')
  assertEquals(rows[0].n, 2)
  await db.close()
})

Deno.test('une passation jamais ouverte n\'a pas de date : aucun état intermédiaire', async () => {
  // « Mieux vaut un silence qu'une fausse promesse » : la colonne reste nulle, et rien
  // ne se substitue à elle côté patient.
  const db = await makeDb()
  assertEquals((await readReceipt(db)).rows[0].practitioner_read_at, null)
  await db.close()
})
