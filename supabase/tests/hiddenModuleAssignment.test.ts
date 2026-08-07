// #406. Tests d'intégration SQL de la garde d'assignation des modules en veille.
//
// Le catalogue praticien filtre déjà `is_hidden` côté lecture, mais un filtre de
// lecture n'est qu'un confort d'interface : il suffit d'un autre chemin d'écriture
// (script, import, appel direct à PostgREST) pour remettre un module en veille chez un
// patient, et le masquage ne servirait plus à rien. La barrière réelle est le trigger
// `trg_guard_hidden_module_assignment`, testé ici contre un vrai Postgres.
//
// Harnais : pglite (Postgres compilé en WASM), aucun Docker ni service container. La
// fonction testée est chargée TELLE QUELLE depuis schema.sql (cf. schemaFunctions.ts) :
// zéro duplication, toute dérive entre le test et le schéma déployé est détectée.
// Seules les tables sont des fixtures minimales.
//
// ⚠️ MDR : rien ici ne lit une donnée patient. La garde porte sur une propriété de
// l'OUTIL (droits de reproduction, périmètre produit), jamais sur ce que le patient a
// saisi.
//
// Exécution : `deno test --allow-read --allow-env --no-lock --node-modules-dir=none supabase/tests/`
// (job CI « SQL — Tests »).

import { assert, assertEquals } from 'jsr:@std/assert@1'
import { PGlite } from 'npm:@electric-sql/pglite@0.5.3'
import { loadFunctions, readSchema } from './schemaFunctions.ts'

const SCHEMA = await readSchema()

/** Base de test : tables minimales + trigger réel extrait du schéma. */
async function makeDb(): Promise<PGlite> {
  const db = new PGlite()
  // Fixtures : uniquement les colonnes lues par la garde.
  await db.exec(`
    create table public.modules (
      id            text primary key,
      is_hidden     boolean not null default false,
      hidden_reason text
    );
    create table public.patient_modules (
      id          serial primary key,
      patient_id  text not null,
      module_type text not null references public.modules(id),
      config      jsonb not null default '{}'::jsonb
    );
    insert into public.modules(id, is_hidden, hidden_reason) values
      ('phq9',   false, null),
      ('gad7',   true,  'beta_scope'),
      ('bsl23',  true,  'rights');
  `)
  await loadFunctions(db, SCHEMA, ['public.fn_guard_hidden_module_assignment'])
  await db.exec(`
    create trigger trg_guard_hidden_module_assignment
      before insert or update of module_type on public.patient_modules
      for each row execute function public.fn_guard_hidden_module_assignment();
  `)
  return db
}

function assign(db: PGlite, moduleType: string): Promise<unknown> {
  return db.query(
    'insert into public.patient_modules(patient_id, module_type) values ($1, $2)',
    ['pat-1', moduleType],
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
  assert(
    String(raised).includes(expectedFragment),
    `message inattendu : ${String(raised)}`,
  )
}

Deno.test('un module visible reste assignable', async () => {
  const db = await makeDb()
  await assign(db, 'phq9')
  const { rows } = await db.query<{ n: number }>('select count(*)::int as n from public.patient_modules')
  assertEquals(rows[0].n, 1)
  await db.close()
})

Deno.test('un module en veille pour motif de droits n\'est pas assignable', async () => {
  const db = await makeDb()
  await assertRejected(() => assign(db, 'bsl23'), 'en veille')
  const { rows } = await db.query<{ n: number }>('select count(*)::int as n from public.patient_modules')
  assertEquals(rows[0].n, 0)
  await db.close()
})

Deno.test('un module en veille pour motif de périmètre n\'est pas assignable non plus', async () => {
  // Le motif change ce qu'on affiche au praticien, jamais le fait que le module soit
  // assignable : les deux familles sont également retirées.
  const db = await makeDb()
  await assertRejected(() => assign(db, 'gad7'), 'en veille')
  await db.close()
})

Deno.test('une assignation existante survit à la mise en veille du module', async () => {
  // Décision du ticket : le module disparaît de la liste du patient, mais ses données
  // ne sont pas supprimées et son historique reste consultable par le praticien. La
  // ligne `patient_modules` doit donc rester en place et modifiable.
  const db = await makeDb()
  await assign(db, 'phq9')
  await db.query(`update public.modules set is_hidden = true, hidden_reason = 'beta_scope' where id = 'phq9'`)

  await db.query(`update public.patient_modules set config = '{"a":1}'::jsonb where module_type = 'phq9'`)
  const { rows } = await db.query<{ n: number }>('select count(*)::int as n from public.patient_modules')
  assertEquals(rows[0].n, 1)
  await db.close()
})

Deno.test('on ne peut pas basculer une assignation existante vers un module en veille', async () => {
  // L'UPDATE de `module_type` est un chemin d'écriture comme un autre : sans lui dans
  // le trigger, il suffirait d'assigner un module visible puis de le renommer.
  const db = await makeDb()
  await assign(db, 'phq9')
  await assertRejected(
    () => db.query(`update public.patient_modules set module_type = 'bsl23' where module_type = 'phq9'`),
    'en veille',
  )
  await db.close()
})
