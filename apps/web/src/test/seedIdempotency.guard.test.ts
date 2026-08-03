import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  readManifest,
  listConfigSeedFiles,
  resolveOrderedFiles,
  missingFromManifest,
} from '../../../../scripts/lib/seedManifest.mjs'

// ─── Garde-fou anti-régression — idempotence réelle des seeds (ticket #203) ─────
//
// 1. Aucune table de CONFIG ne doit rester en `ON CONFLICT … DO NOTHING` : une
//    valeur modifiée dans le seed ne serait jamais propagée sur une ligne déjà
//    présente (dérive silencieuse). Seul le `DO UPDATE` aligne la base sur le seed.
// 2. Tout fichier seed de config doit figurer dans SEED_MANIFEST.json, sinon il
//    n'est jamais rejoué au déploiement (incident « module partiellement déployé »).
// Règle : .claude/rules/config-first.md § « Seeds de config : DO UPDATE ».

const here = dirname(fileURLToPath(import.meta.url))
const supabaseDir = join(here, '..', '..', '..', '..', 'supabase')

// Jonctions PURES : toutes les colonnes sont dans la clé de conflit → un DO UPDATE
// n'aurait aucune colonne à mettre à jour. `DO NOTHING` y est légitime (config-first).
const JUNCTION_ALLOWLIST = new Set(['module_tags', 'psyedu_topic_tags', 'module_topics'])

const INSERT_RE = /insert\s+into\s+(?:public\.)?(\w+)/gi
const DO_NOTHING_RE = /do\s+nothing/gi

// Retire les commentaires de ligne (`-- …`) pour ne pas matcher un `do nothing`
// mentionné en prose. Une troncature de valeur éventuelle est sans effet : on ne
// cherche que les mots-clés `insert into` / `do nothing`.
function stripLineComments(sql: string): string {
  return sql
    .split('\n')
    .map((line) => {
      const i = line.indexOf('--')
      return i === -1 ? line : line.slice(0, i)
    })
    .join('\n')
}

// Table gouvernant chaque clause `do nothing` = dernier `insert into` qui la précède.
// Robuste aux `;` internes (descriptions de sources), contrairement à un split(';').
function configDoNothingTables(sql: string): string[] {
  const text = stripLineComments(sql)
  const inserts: { index: number; table: string }[] = []
  let m: RegExpExecArray | null
  INSERT_RE.lastIndex = 0
  while ((m = INSERT_RE.exec(text)) !== null) {
    inserts.push({ index: m.index, table: m[1].toLowerCase() })
  }
  const tables: string[] = []
  DO_NOTHING_RE.lastIndex = 0
  while ((m = DO_NOTHING_RE.exec(text)) !== null) {
    const at = m.index
    let governing: string | null = null
    for (const ins of inserts) {
      if (ins.index < at) governing = ins.table
      else break
    }
    if (governing !== null) tables.push(governing)
  }
  return tables
}

describe('seeds — garde-fou idempotence (DO NOTHING interdit sur la config)', () => {
  const seedFiles = listConfigSeedFiles(supabaseDir)

  it('énumère bien des fichiers seed (sanity check)', () => {
    expect(seedFiles).toContain('seed.sql')
    expect(seedFiles.length).toBeGreaterThan(5)
  })

  it('aucun DO NOTHING sur une table de config (hors jonctions pures)', () => {
    const offenders: string[] = []
    for (const rel of seedFiles) {
      const sql = readFileSync(join(supabaseDir, rel), 'utf8')
      for (const table of configDoNothingTables(sql)) {
        if (!JUNCTION_ALLOWLIST.has(table)) offenders.push(`${rel} → ${table}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('seeds — garde-fou complétude du manifeste', () => {
  const manifest = readManifest(supabaseDir)

  it('tout seed de config présent sur disque figure dans le manifeste', () => {
    expect(missingFromManifest(manifest, supabaseDir)).toEqual([])
  })

  it('toute entrée du manifeste pointe un fichier existant', () => {
    expect(() => resolveOrderedFiles(manifest, supabaseDir)).not.toThrow()
  })

  it('le manifeste applique schema.sql puis seed.sql en tête', () => {
    expect(manifest.order[0]).toBe('schema.sql')
    expect(manifest.order[1]).toBe('seed.sql')
  })

  it('les thèmes psyedu sont joués avant les topics qui les référencent', () => {
    const themes = manifest.order.indexOf('seed/psyedu_themes_seed.sql')
    const chrono = manifest.order.indexOf('seed/chrono_seed.sql')
    const psyedu = manifest.order.indexOf('seed/psyedu_seed.sql')
    expect(themes).toBeGreaterThan(-1)
    expect(themes).toBeLessThan(chrono)
    expect(themes).toBeLessThan(psyedu)
  })
})
