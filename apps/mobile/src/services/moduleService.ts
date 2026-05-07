import { fetchModuleFields as fetchModuleFieldsShared } from '@psytool/shared'
import { supabase } from '../lib/supabase'
import type { ContentField, ModuleFieldsResult, PreviewKind } from '@psytool/shared'

export type { ContentField, ModuleFieldsResult, PreviewKind }

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

export function fetchModuleFields(moduleId: string): Promise<ModuleFieldsResult> {
  return fetchModuleFieldsShared(supabase, moduleId)
}
