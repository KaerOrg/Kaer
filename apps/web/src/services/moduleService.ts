import { fetchModuleFields as fetchModuleFieldsShared, collectRenderMismatches } from '@kaer/shared'
import { supabase } from '../lib/supabase'
import { reportRenderMismatch } from './renderDiagnosticsService'
import type { ContentField, ModuleFieldsResult, PreviewKind } from '@kaer/shared'

export type { ContentField, ModuleFieldsResult, PreviewKind }

// #90 — Observabilité à la frontière des données : chaque module chargé est confronté
// UNE fois aux capacités du moteur (détecteur pur partagé). Tout non-match (preview_kind
// orphelin / widget_type inconnu) est signalé fire-and-forget. Un seul point de câblage
// pour toute l'app — aucun code de diagnostic dans l'arbre de rendu.
const validatedModules = new Set<string>()

export async function fetchModuleFields(moduleId: string): Promise<ModuleFieldsResult> {
  const result = await fetchModuleFieldsShared(supabase, moduleId)
  if (!validatedModules.has(moduleId)) {
    validatedModules.add(moduleId)
    for (const mismatch of collectRenderMismatches(result.preview_kind, result.fields)) {
      reportRenderMismatch(mismatch)
    }
  }
  return result
}

export async function fetchModulePreviewKind(moduleId: string): Promise<PreviewKind> {
  const { data } = await supabase
    .from('modules')
    .select('preview_kind')
    .eq('id', moduleId)
    .single()
  return (data as { preview_kind: PreviewKind } | null)?.preview_kind ?? 'coming_soon'
}
