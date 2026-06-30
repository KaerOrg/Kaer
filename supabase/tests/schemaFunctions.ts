// #38 — Harnais de test SQL : chargement des fonctions du schéma depuis `schema.sql`.
//
// Ces helpers permettent de tester les fonctions `SECURITY DEFINER` du schéma
// (sélection de purge RGPD, RPC audit, etc.) contre un vrai Postgres éphémère
// (pglite, WASM — aucun Docker ni service container). Le principe clé : on ne
// DUPLIQUE jamais la logique testée. On extrait la définition réelle de la fonction
// depuis `schema.sql` (source de vérité) et on la charge telle quelle dans la base de
// test → toute dérive entre le test et le schéma déployé est détectée.
//
// `extractFunction` / `loadFunctions` sont volontairement agnostiques du moteur :
// `loadFunctions` ne dépend que d'un `SqlExecutor` structurel (`exec(sql)`), donc ce
// module reste testable sans booter pglite.

/** Exécuteur SQL minimal — satisfait structurellement par un client pglite. */
export interface SqlExecutor {
  exec(sql: string): Promise<unknown>
}

/** Lit `supabase/schema.sql` (source de vérité du DDL). */
export function readSchema(): Promise<string> {
  return Deno.readTextFile(new URL('../schema.sql', import.meta.url))
}

/**
 * Extrait la définition complète d'une fonction `create or replace function` depuis
 * un dump SQL, du `create` jusqu'au `;` qui clôt le corps dollar-quoté.
 *
 * Gère un dollar-quote étiqueté quelconque (`$$`, `$func$`, …) : on capture
 * l'étiquette ouvrante puis on cherche sa correspondance fermante, ce qui évite de
 * confondre un `;` interne au corps avec le `;` terminal de l'instruction.
 *
 * @param qualifiedName nom schéma-qualifié, ex. `public.fn_inactive_patient_ids`.
 */
export function extractFunction(sql: string, qualifiedName: string): string {
  const signature = `create or replace function ${qualifiedName}(`
  const start = sql.indexOf(signature)
  if (start === -1) throw new Error(`fonction introuvable dans le schéma : ${qualifiedName}`)

  const tagMatch = /\$[A-Za-z_]*\$/.exec(sql.slice(start))
  if (!tagMatch) throw new Error(`dollar-quote d'ouverture introuvable pour ${qualifiedName}`)
  const tag = tagMatch[0]

  const bodyOpen = start + tagMatch.index + tag.length
  const bodyClose = sql.indexOf(tag, bodyOpen)
  if (bodyClose === -1) throw new Error(`dollar-quote non fermé pour ${qualifiedName}`)

  const semicolon = sql.indexOf(';', bodyClose + tag.length)
  if (semicolon === -1) throw new Error(`point-virgule terminal introuvable pour ${qualifiedName}`)

  return sql.slice(start, semicolon + 1)
}

/** Charge dans la base de test les fonctions nommées, extraites du schéma réel. */
export async function loadFunctions(
  db: SqlExecutor,
  schemaSql: string,
  names: readonly string[],
): Promise<void> {
  for (const name of names) {
    await db.exec(extractFunction(schemaSql, name))
  }
}
