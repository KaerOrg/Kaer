import { fetchModuleFields as fetchModuleFieldsShared } from '@kaer/shared'
import { supabase } from '../lib/supabase'
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
  return result
}
