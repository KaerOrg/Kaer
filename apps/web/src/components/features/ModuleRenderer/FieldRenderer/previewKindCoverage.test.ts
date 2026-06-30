// Garde CI (issue #90) : garantit que chaque module défini dans seed.sql a un
// preview_kind CONNU du moteur de rendu — sinon le web tombe dans FallbackLayout et
// le mobile rend un écran vide (non-match orphelin signalé à l'exécution par
// `report-render-mismatch`, mais on l'attrape ici AVANT la prod quand c'est possible).
//
// Source de vérité UNIQUE : `PREVIEW_KINDS` (@kaer/shared), dont dérive aussi le type
// `PreviewKind`. Aucune liste à maintenir ici — ajouter un preview_kind se fait à un
// seul endroit (le tableau partagé), et type + dispatchers + cette garde restent alignés.
//
// Introduit après la régression du 06/06/2026 où mood_tracker et medication_side_effects
// avaient preview_kind='mood_tracker'/'medication_side_effects' (inconnus), causant
// l'affichage du FallbackLayout (liste plate sans graphiques).

import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { describe, it, expect } from 'vitest'
import { PREVIEW_KINDS, RENDERABLE_WIDGET_TYPES } from '@kaer/shared'

const KNOWN_PREVIEW_KINDS = new Set<string>(PREVIEW_KINDS)

// Concatène tous les seeds (seed.sql + seed/*.sql) — les field_props vivent dispersés.
function allSeedSql(): string {
  const supabaseDir = resolve(process.cwd(), '../../supabase')
  const files = [join(supabaseDir, 'seed.sql')]
  const seedSubdir = join(supabaseDir, 'seed')
  try {
    for (const name of readdirSync(seedSubdir)) {
      if (name.endsWith('.sql')) files.push(join(seedSubdir, name))
    }
  } catch { /* pas de sous-dossier seed/ */ }
  return files.map(f => readFileSync(f, 'utf-8')).join('\n')
}

// Valeurs de widget_type posées en field_props : tuple ('field_id', 'widget_type', 'valeur').
function extractWidgetTypes(sql: string): Set<string> {
  const out = new Set<string>()
  const re = /\(\s*'[^']*'\s*,\s*'widget_type'\s*,\s*'([^']*)'\s*\)/g
  for (const m of sql.matchAll(re)) out.add(m[1])
  return out
}

function extractModulePreviewKinds(sql: string): Map<string, string> {
  const result = new Map<string, string>()

  // 1. Blocs INSERT INTO public.modules — preview_kind est toujours en 3ème colonne
  //    dans les deux formats du seed (avec ou sans icon/mobile_icon/color).
  const insertBlockRegex = /insert\s+into\s+public\.modules\s*\([^)]+\)\s*values([\s\S]*?);/gi
  for (const block of sql.matchAll(insertBlockRegex)) {
    const rowPattern = /\(\s*'([\w_]+)'\s*,\s*'[\w-]+'\s*,\s*'([\w_]+)'/g
    for (const row of block[1].matchAll(rowPattern)) {
      result.set(row[1], row[2]) // module_id → preview_kind initial
    }
  }

  // 2. UPDATE SET preview_kind — écrase l'état initial (valeur finale en base).
  //    Seule la cible du SET compte ; la clause WHERE montre l'ancien état, ignorée.
  const updatePattern =
    /update\s+public\.modules\s+set\s+preview_kind\s*=\s*'([\w_]+)'\s+where\s+id\s*=\s*'([\w_]+)'/gi
  for (const m of sql.matchAll(updatePattern)) {
    result.set(m[2], m[1]) // module_id → nouveau preview_kind
  }

  return result
}

describe('seed.sql — cohérence preview_kind', () => {
  it('chaque module a un preview_kind connu du moteur de rendu (pas de FallbackLayout)', () => {
    const seedPath = resolve(process.cwd(), '../../supabase/seed.sql')
    const sql = readFileSync(seedPath, 'utf-8')

    const modulePreviewKinds = extractModulePreviewKinds(sql)

    expect(modulePreviewKinds.size).toBeGreaterThan(0)

    const invalid = [...modulePreviewKinds.entries()]
      .filter(([, kind]) => !KNOWN_PREVIEW_KINDS.has(kind))
      .map(([id, kind]) => ({ module: id, preview_kind: kind }))

    expect(
      invalid,
      [
        'Ces modules ont un preview_kind inconnu du moteur de rendu :',
        JSON.stringify(invalid, null, 2),
        '',
        '→ Soit ajouter le preview_kind dans PREVIEW_KINDS (@kaer/shared) si le layout existe,',
        '  soit corriger le seed pour utiliser un preview_kind existant.',
      ].join('\n'),
    ).toHaveLength(0)
  })

  it('PREVIEW_KINDS couvre au moins les layouts du seed actuel', () => {
    // Garde-fou inverse : la source partagée ne doit pas être vide ou sous-dimensionnée.
    expect(KNOWN_PREVIEW_KINDS.size).toBeGreaterThanOrEqual(19)
  })
})

// Garde CI (issue #90) : tout widget_type posé en field_props doit être rendu par
// FieldWidget. Source unique : RENDERABLE_WIDGET_TYPES (@kaer/shared), consommée aussi
// par le détecteur runtime `collectRenderMismatches`. Un widget_type orphelin = écran
// muet côté patient — attrapé ici AVANT la prod.
describe('seeds — cohérence widget_type', () => {
  it('chaque widget_type des field_props est connu de FieldWidget', () => {
    const widgetTypes = extractWidgetTypes(allSeedSql())
    expect(widgetTypes.size).toBeGreaterThan(0)

    const invalid = [...widgetTypes].filter(w => !RENDERABLE_WIDGET_TYPES.has(w))
    expect(
      invalid,
      [
        'Ces widget_type ne sont rendus par aucun composant FieldWidget :',
        JSON.stringify(invalid, null, 2),
        '',
        '→ Soit ajouter le widget à FieldWidget + RENDERABLE_WIDGET_TYPES (@kaer/shared),',
        '  soit corriger le seed.',
      ].join('\n'),
    ).toHaveLength(0)
  })
})
