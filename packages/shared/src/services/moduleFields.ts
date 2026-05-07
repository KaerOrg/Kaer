import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentField, ModuleFieldsResult, PreviewKind } from '../index'

interface RawField {
  id: string
  module_id: string
  section_id: string | null
  parent_field_id: string | null
  field_type: string
  text_code: string | null
  sort_order: number
}

interface RawProp {
  field_id: string
  prop_key: string
  prop_value: string
}

export async function fetchModuleFields(
  client: SupabaseClient,
  moduleId: string
): Promise<ModuleFieldsResult> {
  const [{ data: moduleRow }, { data: rawFields }] = await Promise.all([
    client.from('modules').select('preview_kind').eq('id', moduleId).single(),
    client
      .from('module_content_fields')
      .select('id, module_id, section_id, parent_field_id, field_type, text_code, sort_order')
      .eq('module_id', moduleId)
      .order('sort_order'),
  ])

  const preview_kind: PreviewKind =
    (moduleRow as { preview_kind: PreviewKind } | null)?.preview_kind ?? 'coming_soon'
  const allFields = (rawFields ?? []) as RawField[]

  if (allFields.length === 0) return { preview_kind, fields: [] }

  const fieldIds = allFields.map(f => f.id)
  const { data: propsData } = await client
    .from('field_props')
    .select('field_id, prop_key, prop_value')
    .in('field_id', fieldIds)

  const propsMap = new Map<string, Record<string, string>>()
  for (const p of (propsData ?? []) as RawProp[]) {
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
