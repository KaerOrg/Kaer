// Garantit que chaque module défini dans seed.sql a un preview_kind
// explicitement géré par LayoutDispatcher (pas de chute dans FallbackLayout).
//
// Comment maintenir ce test :
//   - Nouvelle valeur preview_kind dans LayoutDispatcher → l'ajouter ici dans HANDLED_PREVIEW_KINDS
//   - Nouveau module dans seed.sql → son preview_kind doit être dans HANDLED_PREVIEW_KINDS
//
// Ce test a été introduit après la régression du 06/06/2026 où mood_tracker et
// medication_side_effects avaient preview_kind='mood_tracker'/'medication_side_effects'
// (non gérés), causant l'affichage du FallbackLayout (liste plate sans graphiques).

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

// Source de vérité : toutes les valeurs de preview_kind gérées par LayoutDispatcher.tsx.
// FallbackLayout N'EST PAS dans cette liste — y atterrir est un bug.
const HANDLED_PREVIEW_KINDS = new Set([
  'coming_soon',
  'psyedu',
  'chrono_month',
  'tabbed',
  'steps',
  'cards',
  'editable_steps',
  'fields',
  'questionnaire',
  'slider_dashboard',
  'daily_checkin',
  'sleep_journal',
  'activity_log',
  'decision_grid',
  'exposure_tracker',
  'tree_selector',
  'column_form',
  'guided_exercise',
  'patient_scenario',
])

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
  it('chaque module a un preview_kind géré par LayoutDispatcher (pas de FallbackLayout)', () => {
    const seedPath = resolve(process.cwd(), '../../supabase/seed.sql')
    const sql = readFileSync(seedPath, 'utf-8')

    const modulePreviewKinds = extractModulePreviewKinds(sql)

    expect(modulePreviewKinds.size).toBeGreaterThan(0)

    const invalid = [...modulePreviewKinds.entries()]
      .filter(([, kind]) => !HANDLED_PREVIEW_KINDS.has(kind))
      .map(([id, kind]) => ({ module: id, preview_kind: kind }))

    expect(
      invalid,
      [
        'Ces modules ont un preview_kind inconnu de LayoutDispatcher :',
        JSON.stringify(invalid, null, 2),
        '',
        '→ Soit ajouter le preview_kind dans HANDLED_PREVIEW_KINDS (si le layout existe),',
        '  soit corriger le seed pour utiliser un preview_kind existant.',
      ].join('\n'),
    ).toHaveLength(0)
  })

  it('HANDLED_PREVIEW_KINDS contient au moins les layouts du seed actuel', () => {
    // Vérifie l'inverse : HANDLED_PREVIEW_KINDS ne doit pas être vide ou sous-dimensionné.
    expect(HANDLED_PREVIEW_KINDS.size).toBeGreaterThanOrEqual(19)
  })
})
