// Helpers purs autour de SEED_MANIFEST.json — partagés par le runner (apply-seeds)
// et le garde-fou de test. Aucune I/O réseau, aucune dépendance : juste fs + path,
// pour rester testable sans base ni npm install.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/** Lit et valide SEED_MANIFEST.json. Throw si le champ `order` est absent/malformé. */
export function readManifest(supabaseDir) {
  const raw = readFileSync(join(supabaseDir, 'SEED_MANIFEST.json'), 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed.order) || parsed.order.length === 0) {
    throw new Error('SEED_MANIFEST.json : champ "order" absent, vide ou non-tableau.')
  }
  return parsed
}

// Fichiers seed de CONFIG réellement présents sur le disque : seed.sql + seed/*.sql.
// Les migrations one-shot (supabase/migration_*.sql) sont HORS périmètre du rejeu
// idempotent (elles ont déjà été appliquées), donc volontairement exclues.
export function listConfigSeedFiles(supabaseDir) {
  const files = ['seed.sql']
  const subdir = join(supabaseDir, 'seed')
  for (const name of readdirSync(subdir).sort()) {
    if (name.endsWith('.sql')) files.push(`seed/${name}`)
  }
  return files
}

// Résout l'ordre du manifeste en chemins absolus, en validant que chaque fichier
// référencé existe. Throw sur la première référence morte (fail-fast au déploiement).
export function resolveOrderedFiles(manifest, supabaseDir) {
  return manifest.order.map((rel) => {
    const abs = join(supabaseDir, rel)
    if (!existsSync(abs)) {
      throw new Error(`SEED_MANIFEST.json référence un fichier absent : ${rel}`)
    }
    return { rel, abs }
  })
}

// Seeds de config présents sur disque mais ABSENTS du manifeste → ils ne seraient
// jamais rejoués au déploiement (cause de l'incident « module partiellement déployé »
// du ticket #203). `schema.sql` n'est pas un seed de config, on ne l'attend pas ici.
export function missingFromManifest(manifest, supabaseDir) {
  const listed = new Set(manifest.order)
  return listConfigSeedFiles(supabaseDir).filter((f) => !listed.has(f))
}
