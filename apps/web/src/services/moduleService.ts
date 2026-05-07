import { supabase } from '../lib/supabase'

export interface ContentField {
  id: string
  module_id: string
  section_id: string | null
  parent_field_id: string | null
  field_type: string
  text_code: string | null
  sort_order: number
  props: Record<string, string>
  children: ContentField[]
}

export interface ModuleFieldsResult {
  preview_kind: string
  fields: ContentField[]
}

export interface PsychoCardInfo {
  id: string
  titleKey: string
  summaryKey: string
}

export async function fetchModuleFields(moduleId: string): Promise<ModuleFieldsResult> {
  const [{ data: moduleRow }, { data: rawFields }] = await Promise.all([
    supabase.from('modules').select('preview_kind').eq('id', moduleId).single(),
    supabase
      .from('module_content_fields')
      .select('id, module_id, section_id, parent_field_id, field_type, text_code, sort_order')
      .eq('module_id', moduleId)
      .order('sort_order'),
  ])

  const preview_kind =
    (moduleRow as { preview_kind: string } | null)?.preview_kind ?? 'coming_soon'
  const allFields = rawFields ?? []

  if (allFields.length === 0) return { preview_kind, fields: [] }

  const fieldIds = allFields.map(f => f.id)
  const { data: propsData } = await supabase
    .from('field_props')
    .select('field_id, prop_key, prop_value')
    .in('field_id', fieldIds)

  const propsMap = new Map<string, Record<string, string>>()
  for (const p of propsData ?? []) {
    let entry = propsMap.get(p.field_id)
    if (!entry) {
      entry = {}
      propsMap.set(p.field_id, entry)
    }
    entry[p.prop_key] = p.prop_value
  }

  const fieldMap = new Map<string, ContentField>()
  for (const f of allFields) {
    fieldMap.set(f.id, {
      id: f.id,
      module_id: f.module_id,
      section_id: f.section_id,
      parent_field_id: f.parent_field_id,
      field_type: f.field_type,
      text_code: f.text_code,
      sort_order: f.sort_order,
      props: propsMap.get(f.id) ?? {},
      children: [],
    })
  }

  const topLevel: ContentField[] = []
  for (const f of allFields) {
    const field = fieldMap.get(f.id)!
    if (f.parent_field_id) {
      fieldMap.get(f.parent_field_id)?.children.push(field)
    } else {
      topLevel.push(field)
    }
  }

  return { preview_kind, fields: topLevel }
}

export async function fetchModulePreviewKind(moduleId: string): Promise<string> {
  const { data } = await supabase
    .from('modules')
    .select('preview_kind')
    .eq('id', moduleId)
    .single()
  return (data as { preview_kind: string } | null)?.preview_kind ?? 'coming_soon'
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
