import { supabase } from '../lib/supabase'

export interface ModuleItem {
  id: string
  icon: string
  mobile_icon: string
  color: string
}

export interface ModuleCategory {
  id: string
  icon: string
  labelKey: string
  subtitleKey: string
  modules: ModuleItem[]
}

export async function fetchModuleCategories(): Promise<ModuleCategory[]> {
  const [{ data: cats }, { data: mods }] = await Promise.all([
    supabase.from('module_categories').select('id, sort_order, icon').order('sort_order'),
    supabase.from('modules').select('id, category_id, sort_order, icon, mobile_icon, color').order('sort_order'),
  ])

  if (!cats || !mods) return []

  return cats.map(cat => ({
    id: cat.id,
    icon: cat.icon ?? '',
    labelKey: `category.${cat.id}.label`,
    subtitleKey: `category.${cat.id}.subtitle`,
    modules: mods
      .filter(m => m.category_id === cat.id)
      .map(m => ({ id: m.id, icon: m.icon ?? '', mobile_icon: m.mobile_icon ?? '', color: m.color ?? '#6366F1' })),
  }))
}

export interface TagDimension {
  id: string
  sort_order: number
}

export interface Tag {
  id: string
  dimension_id: string
  sort_order: number
}

export interface ModuleTaxonomy {
  /** Axes de filtrage, triés par sort_order. */
  dimensions: TagDimension[]
  /** Tags d'une dimension, triés par sort_order. Clé = dimension_id. */
  tagsByDimension: Map<string, Tag[]>
  /** Tags portés par un module. Clé = module_id. */
  tagsByModule: Map<string, Set<string>>
}

/**
 * Charge la taxonomie complète de l'armoire (axes, tags, liaisons modules).
 * Source de vérité : docs/spec/module-taxonomy.md. Métadonnée d'outil
 * uniquement (MDR) — aucune donnée patient n'entre ici.
 */
export async function fetchModuleTaxonomy(): Promise<ModuleTaxonomy> {
  const [{ data: dims }, { data: tags }, { data: links }] = await Promise.all([
    supabase.from('tag_dimensions').select('id, sort_order').order('sort_order'),
    supabase.from('tags').select('id, dimension_id, sort_order').order('sort_order'),
    supabase.from('module_tags').select('module_id, tag_id'),
  ])

  const tagsByDimension = new Map<string, Tag[]>()
  for (const tag of tags ?? []) {
    const bucket = tagsByDimension.get(tag.dimension_id)
    if (bucket) { bucket.push(tag) } else { tagsByDimension.set(tag.dimension_id, [tag]) }
  }

  const tagsByModule = new Map<string, Set<string>>()
  for (const link of links ?? []) {
    const bucket = tagsByModule.get(link.module_id)
    if (bucket) { bucket.add(link.tag_id) } else { tagsByModule.set(link.module_id, new Set([link.tag_id])) }
  }

  return { dimensions: dims ?? [], tagsByDimension, tagsByModule }
}

export async function fetchComingSoonModuleIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('modules')
    .select('id')
    .eq('preview_kind', 'coming_soon')
  return new Set((data ?? []).map(m => m.id))
}

export async function fetchInviteCategories(): Promise<ModuleCategory[]> {
  const [{ data: cats }, { data: mods }] = await Promise.all([
    supabase.from('module_categories').select('id, sort_order, icon').order('sort_order'),
    supabase
      .from('modules')
      .select('id, category_id, sort_order, icon, mobile_icon, color, is_invite_excluded, preview_kind')
      .order('sort_order'),
  ])

  if (!cats || !mods) return []

  return cats
    .map(cat => ({
      id: cat.id,
      icon: cat.icon ?? '',
      labelKey: `category.${cat.id}.label`,
      subtitleKey: `category.${cat.id}.subtitle`,
      modules: mods
        .filter(m => m.category_id === cat.id && !m.is_invite_excluded && m.preview_kind !== 'coming_soon')
        .map(m => ({ id: m.id, icon: m.icon ?? '', mobile_icon: m.mobile_icon ?? '', color: m.color ?? '#6366F1' })),
    }))
    .filter(cat => cat.modules.length > 0)
}
