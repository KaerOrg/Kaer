// #38 — Tests unitaires de l'extracteur de fonctions du schéma.
//
// Exécution : `deno test --allow-read --allow-env --no-lock --node-modules-dir=none supabase/tests/`
// (job CI « SQL — Tests »).

import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1'
import { extractFunction, loadFunctions, readSchema, type SqlExecutor } from './schemaFunctions.ts'

const SAMPLE = `
-- bruit avant
create or replace function public.fn_a(x int)
returns int language sql as $$
  select x + 1; -- un point-virgule interne, ne doit pas clore l'extraction
$$;

revoke all on function public.fn_a(int) from public;

create or replace function public.fn_b()
returns text language plpgsql as $func$
begin
  return 'ok';
end;
$func$;
`

Deno.test('extractFunction isole la première fonction, point-virgule interne inclus', () => {
  const out = extractFunction(SAMPLE, 'public.fn_a')
  assert(out.startsWith('create or replace function public.fn_a(x int)'))
  assert(out.includes('select x + 1;'))
  assert(out.trimEnd().endsWith('$$;'))
  // Ne déborde pas sur la fonction suivante ni sur le revoke.
  assert(!out.includes('revoke'))
  assert(!out.includes('fn_b'))
})

Deno.test('extractFunction gère un dollar-quote étiqueté ($func$)', () => {
  const out = extractFunction(SAMPLE, 'public.fn_b')
  assert(out.startsWith('create or replace function public.fn_b()'))
  assert(out.trimEnd().endsWith('$func$;'))
  assert(out.includes("return 'ok';"))
})

Deno.test('extractFunction lève si la fonction est absente', () => {
  assertThrows(() => extractFunction(SAMPLE, 'public.fn_missing'), Error, 'introuvable')
})

Deno.test('loadFunctions exécute chaque définition extraite, dans l\'ordre', async () => {
  const executed: string[] = []
  const fakeDb: SqlExecutor = {
    exec: (sql: string) => {
      executed.push(sql)
      return Promise.resolve()
    },
  }
  await loadFunctions(fakeDb, SAMPLE, ['public.fn_a', 'public.fn_b'])
  assertEquals(executed.length, 2)
  assert(executed[0].includes('public.fn_a'))
  assert(executed[1].includes('public.fn_b'))
})

Deno.test('readSchema lit le schema.sql réel et y trouve les fonctions de purge', async () => {
  const schema = await readSchema()
  // Garde-fou anti-dérive : les noms de fonctions attendus existent toujours.
  assert(extractFunction(schema, 'public.fn_inactive_patient_ids').length > 0)
  assert(extractFunction(schema, 'public.purge_retention_table').length > 0)
})
