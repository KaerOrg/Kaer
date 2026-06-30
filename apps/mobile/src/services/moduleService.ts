import { fetchModuleFields as fetchModuleFieldsShared, collectRenderMismatches } from '@kaer/shared'
import { supabase } from '../lib/supabase'
import { reportRenderMismatch } from './renderDiagnosticsService'
import type { ContentField, ModuleFieldsResult, PreviewKind } from '@kaer/shared'

export type { ContentField, ModuleFieldsResult, PreviewKind }

const moduleFieldsCache = new Map<string, ModuleFieldsResult>()

export async function fetchPatientModuleConfig(
  patientId: string,
  moduleType: string
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', moduleType)
    .is('revoked_at', null)
    .maybeSingle()
  return (data?.config as Record<string, unknown>) ?? null
}

export async function fetchModuleFields(moduleId: string): Promise<ModuleFieldsResult> {
  const cached = moduleFieldsCache.get(moduleId)
  if (cached) return cached
  const result = await fetchModuleFieldsShared(supabase, moduleId)
  moduleFieldsCache.set(moduleId, result)
  // #90 — Observabilité à la frontière des données : à chaque chargement réel (cache
  // miss), on confronte le module aux capacités du moteur (détecteur pur partagé) et on
  // signale tout non-match (fire-and-forget). Un seul point de câblage pour toute l'app.
  for (const mismatch of collectRenderMismatches(result.preview_kind, result.fields)) {
    void reportRenderMismatch(mismatch)
  }
  return result
}
