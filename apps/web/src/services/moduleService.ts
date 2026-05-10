import { fetchModuleFields as fetchModuleFieldsShared } from '@psytool/shared'
import { supabase } from '../lib/supabase'
import type { ContentField, ModuleFieldsResult, PreviewKind } from '@psytool/shared'

export type { ContentField, ModuleFieldsResult, PreviewKind }

export interface PsychoCardInfo {
  id: string
  titleKey: string
  summaryKey: string
}

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

export async function fetchPsychoCards(): Promise<PsychoCardInfo[]> {
  const { data } = await supabase
    .from('module_content_fields')
    .select('id, section_id, text_code')
    .eq('module_id', 'psychoeducation')
    .eq('field_type', 'card_title')
    .order('sort_order')

  return (data ?? []).map(f => ({
    id: f.section_id ?? f.id,
    titleKey: f.text_code ?? '',
    summaryKey: (f.text_code ?? '').replace(/\.title$/, '.summary'),
  }))
}
