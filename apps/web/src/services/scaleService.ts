import { supabase } from '../lib/supabase'

export type ScaleCategory =
  | 'Humeur'
  | 'Anxiété'
  | 'Sommeil'
  | 'Addictologie'
  | 'Psychose'
  | 'Personnalité'
  | 'Neurodev'
  | 'Trauma'

export type TargetAge = 'perinatal' | 'enfant' | 'ado' | 'adulte' | 'senior'

export const AGE_ORDER: readonly TargetAge[] = [
  'perinatal',
  'enfant',
  'ado',
  'adulte',
  'senior',
] as const

export const SCALE_CATEGORIES: readonly ScaleCategory[] = [
  'Humeur',
  'Anxiété',
  'Sommeil',
  'Addictologie',
  'Psychose',
  'Personnalité',
  'Neurodev',
  'Trauma',
] as const

export const AGE_BADGE_CONFIG: Record<TargetAge, { bg: string; text: string }> = {
  perinatal: { bg: '#FBCFE8', text: '#9D174D' },
  enfant:    { bg: '#BFDBFE', text: '#1E40AF' },
  ado:       { bg: '#DDD6FE', text: '#5B21B6' },
  adulte:    { bg: '#BBF7D0', text: '#15803D' },
  senior:    { bg: '#FEF08A', text: '#854D0E' },
}

export const CATEGORY_KEY: Record<ScaleCategory, string> = {
  'Humeur':       'humeur',
  'Anxiété':      'anxiete',
  'Sommeil':      'sommeil',
  'Addictologie': 'addictologie',
  'Psychose':     'psychose',
  'Personnalité': 'personnalite',
  'Neurodev':     'neurodev',
  'Trauma':       'trauma',
}

export interface ScaleMetaRow {
  id: string
  evaluationType: 'auto' | 'hetero'
  category: ScaleCategory
  targetAges: TargetAge[]
  validatedAgeRange: string
  noToggle: boolean
  hasPreview: boolean
  iconName: string
  referenceLabel: string
  referenceUrl: string
}

export async function fetchScaleMeta(): Promise<ScaleMetaRow[]> {
  const { data: fields, error } = await supabase
    .from('module_content_fields')
    .select('id, module_id')
    .eq('field_type', 'scale_meta')
    .order('sort_order')

  if (error || !fields?.length) return []

  const { data: props } = await supabase
    .from('field_props')
    .select('field_id, prop_key, prop_value')
    .in('field_id', fields.map(f => f.id))

  const propMap = new Map<string, Record<string, string>>()
  for (const p of props ?? []) {
    if (!propMap.has(p.field_id)) propMap.set(p.field_id, {})
    propMap.get(p.field_id)![p.prop_key] = p.prop_value
  }

  return fields.map(field => {
    const p = propMap.get(field.id) ?? {}
    return {
      id: field.module_id,
      evaluationType: (p.evaluation_type ?? 'auto') as 'auto' | 'hetero',
      category: (p.category ?? 'Humeur') as ScaleCategory,
      targetAges: JSON.parse(p.target_ages ?? '[]') as TargetAge[],
      validatedAgeRange: p.validated_age_range ?? '',
      noToggle: p.no_toggle === 'true',
      hasPreview: p.has_preview === 'true',
      iconName: p.icon_name ?? 'clipboard-list',
      referenceLabel: p.reference_label ?? '',
      referenceUrl: p.reference_url ?? '',
    }
  })
}
