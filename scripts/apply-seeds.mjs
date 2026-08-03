#!/usr/bin/env node
// Rejeu idempotent du schéma + des seeds de config Kær, dans l'ordre du manifeste.
// Objectif ticket #203 (critère 2) : rendre la base IDENTIQUE au seed à chaque
// release. À lancer au déploiement (ou à la main). Voir docs/seed-deployment.md.
//
// Usage :
//   DATABASE_URL='postgres://…' node scripts/apply-seeds.mjs
//   node scripts/apply-seeds.mjs --url 'postgres://…'
//   node scripts/apply-seeds.mjs --dry-run        # liste l'ordre sans rien exécuter
//
// Prérequis : `psql` disponible dans le PATH. Le script n'embarque aucun secret :
// la connexion vient de DATABASE_URL / --url, fournie au lancement.

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readManifest, resolveOrderedFiles } from './lib/seedManifest.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const supabaseDir = join(here, '..', 'supabase')

function parseArgs(argv) {
  const args = { dryRun: false, url: process.env.DATABASE_URL ?? '' }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true
    else if (argv[i] === '--url') args.url = argv[++i] ?? ''
  }
  return args
}

function main() {
  const { dryRun, url } = parseArgs(process.argv.slice(2))
  const manifest = readManifest(supabaseDir)
  const files = resolveOrderedFiles(manifest, supabaseDir)

  console.log(`Manifeste : ${files.length} fichiers à rejouer dans l'ordre.`)

  if (dryRun) {
    files.forEach((f, i) => console.log(`  ${String(i + 1).padStart(2, '0')}. ${f.rel}`))
    console.log('\n(--dry-run : aucun fichier exécuté.)')
    return
  }

  if (!url) {
    console.error(
      'Erreur : connexion base manquante. Fournir DATABASE_URL ou --url "postgres://…".',
    )
    process.exit(2)
  }

  for (const [i, f] of files.entries()) {
    console.log(`\n[${i + 1}/${files.length}] psql -f ${f.rel}`)
    // ON_ERROR_STOP=1 : le rejeu s'arrête à la première erreur SQL (fail-fast),
    // au lieu de continuer sur une base à moitié seedée.
    execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', f.abs], { stdio: 'inherit' })
  }

  console.log('\n✓ Rejeu terminé — la base reflète les fichiers seed.')
}

main()
