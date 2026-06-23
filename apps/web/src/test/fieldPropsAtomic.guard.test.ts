import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Garde-fou anti-régression — `field_props.prop_value` atomique (issue #70) ─
//
// `field_props` est une table de config EAV (PK `field_id, prop_key`) : une
// `prop_value` = une donnée atomique. Une structure (plusieurs attributs ou une
// liste) ne se packe JAMAIS dans une string (CSV/JSON/`kind:param`) — elle
// s'éclate en props frères nommés ou en clés indexées `base_1`, `base_2`, …
// Ce test scanne tous les seeds SQL et échoue si une valeur packée réapparaît.
// Doc : docs/module-engine.md § « Convention field_props : prop_value atomique ».

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..', '..')
const supabaseDir = join(repoRoot, 'supabase')

// Clés legacy qui portaient une liste packée — bannies définitivement.
const FORBIDDEN_PACKED_KEYS = ['durations', 'required_keys_any', 'target_ages']

function seedFiles(): string[] {
  const files = [join(supabaseDir, 'seed.sql')]
  const seedSubdir = join(supabaseDir, 'seed')
  for (const name of readdirSync(seedSubdir)) {
    if (name.endsWith('.sql')) files.push(join(seedSubdir, name))
  }
  return files
}

// Extrait les tuples `('field_id', 'prop_key', 'prop_value')` d'un insert
// field_props. prop_key est un identifiant simple ([a-z0-9_]) ; prop_value est
// capturée jusqu'au dernier quote de la ligne (suffisant pour nos contrôles).
const TUPLE_RE = /\(\s*'[^']*'\s*,\s*'([a-z0-9_]+)'\s*,\s*'(.*)'\s*\)/

interface PropEntry { file: string; line: number; key: string; value: string }

function collectProps(): PropEntry[] {
  const entries: PropEntry[] = []
  for (const file of seedFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((raw, i) => {
      const m = TUPLE_RE.exec(raw)
      if (m) entries.push({ file, line: i + 1, key: m[1], value: m[2] })
    })
  }
  return entries
}

describe('field_props — garde-fou prop_value atomique (seeds)', () => {
  const props = collectProps()

  it('scanne effectivement des props (sanity check du parseur)', () => {
    expect(props.length).toBeGreaterThan(50)
  })

  it('aucune clé legacy packée (durations / required_keys_any / target_ages)', () => {
    const offenders = props
      .filter(p => FORBIDDEN_PACKED_KEYS.includes(p.key))
      .map(p => `${p.file}:${p.line} → ${p.key}`)
    expect(offenders).toEqual([])
  })

  it("aucun widget_type packé (kind:param) — widget_type ne porte que le kind", () => {
    const offenders = props
      .filter(p => p.key === 'widget_type' && p.value.includes(':'))
      .map(p => `${p.file}:${p.line} → widget_type='${p.value}'`)
    expect(offenders).toEqual([])
  })

  it('aucune prop_value en tableau JSON ([...]) — utiliser des clés indexées', () => {
    const offenders = props
      .filter(p => /^\[.*\]$/.test(p.value.trim()))
      .map(p => `${p.file}:${p.line} → ${p.key}='${p.value}'`)
    expect(offenders).toEqual([])
  })
})
