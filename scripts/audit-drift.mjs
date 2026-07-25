#!/usr/bin/env node
// Audit anti-dérive config seed ↔ base (ticket #203, critères 3 & 5).
//
// Méthode robuste voulue par le ticket : Postgres rejoue les fichiers seed sur une
// base jetable (branche Supabase, base locale…), et on DIFFE cette base « source de
// vérité » contre la base cible (prod, en lecture seule). Zéro parsing regex des
// seeds — c'est Postgres qui fait foi.
//
// Workflow type :
//   1. Créer une base jetable, y appliquer le manifeste :
//        DATABASE_URL="$SEED_DB_URL" node scripts/apply-seeds.mjs
//   2. Diffuser contre la prod :
//        SEED_DB_URL='postgres://…scratch' TARGET_DB_URL='postgres://…prod' \
//          node scripts/audit-drift.mjs
//
// Sortie : rapport par table ; code de sortie 1 s'il existe la moindre dérive.
// Prérequis : `psql` dans le PATH. Aucun secret embarqué (connexions via env).

import { execFileSync } from 'node:child_process'
import { CONFIG_TABLES, diffTable, hasDrift } from './lib/configDiff.mjs'

// Extrait toutes les lignes d'une table sous forme de tableau JSON, via psql.
function fetchRows(url, table, keyColumns) {
  const orderBy = keyColumns.join(', ')
  const sql = `select coalesce(json_agg(t), '[]'::json) from (select * from public.${table} order by ${orderBy}) t;`
  const out = execFileSync('psql', [url, '-Atq', '-c', sql], { encoding: 'utf8' })
  return JSON.parse(out.trim() || '[]')
}

function reportTable(result) {
  const { table, missing, extra, changed } = result
  const total = missing.length + extra.length + changed.length
  if (total === 0) {
    console.log(`✓ ${table} — aligné (0 écart)`)
    return
  }
  console.log(`✗ ${table} — ${total} écart(s) :`)
  if (missing.length) console.log(`    manquant en cible (jamais déployé) : ${missing.length}`)
  if (changed.length) console.log(`    divergent (dérive de valeur)       : ${changed.length}`)
  if (extra.length) console.log(`    en trop en cible (orpheline ?)     : ${extra.length}`)
  for (const c of changed) console.log(`      ~ ${c.key}`)
  for (const m of missing) console.log(`      - ${JSON.stringify(m).slice(0, 160)}`)
  for (const e of extra) console.log(`      + ${JSON.stringify(e).slice(0, 160)}`)
}

function main() {
  const seedUrl = process.env.SEED_DB_URL
  const targetUrl = process.env.TARGET_DB_URL
  if (!seedUrl || !targetUrl) {
    console.error(
      'Erreur : SEED_DB_URL (base fraîchement seedée) et TARGET_DB_URL (cible) requis.',
    )
    process.exit(2)
  }

  console.log(`Audit de dérive sur ${CONFIG_TABLES.length} tables de config.\n`)
  const results = CONFIG_TABLES.map((spec) => {
    const seedRows = fetchRows(seedUrl, spec.table, spec.keyColumns)
    const targetRows = fetchRows(targetUrl, spec.table, spec.keyColumns)
    return diffTable(spec, seedRows, targetRows)
  })

  results.forEach(reportTable)

  if (hasDrift(results)) {
    console.error('\n✗ Dérive détectée — la cible diverge des fichiers seed.')
    process.exit(1)
  }
  console.log('\n✓ Aucune dérive — la cible reflète les fichiers seed.')
}

main()
