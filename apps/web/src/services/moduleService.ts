import { fetchModuleFields as fetchModuleFieldsShared } from '@psytool/shared'
import { supabase } from '../lib/supabase'
import type { ContentField, ModuleFieldsResult, PreviewKind } from '@psytool/shared'

export type { ContentField, ModuleFieldsResult, PreviewKind }

export function fetchModuleFields(moduleId: string): Promise<ModuleFieldsResult> {
  return fetchModuleFieldsShared(supabase, moduleId)
}

export async function fetchModulePreviewKind(moduleId: string): Promise<PreviewKind> {
  const { data } = await supabase
    .from('modules')
    .select('preview_kind')
    .eq('id', moduleId)
    .single()
  return (data as { preview_kind: PreviewKind } | null)?.preview_kind ?? 'coming_soon'
}
