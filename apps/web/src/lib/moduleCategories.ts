import { supabase } from './supabase'

export interface ModuleCategory {
  id: string
  labelKey: string
  subtitleKey: string
  modules: string[]
}

export async function fetchModuleCategories(): Promise<ModuleCategory[]> {
  const [{ data: cats }, { data: mods }] = await Promise.all([
    supabase.from('module_categories').select('id, sort_order').order('sort_order'),
    supabase.from('modules').select('id, category_id, sort_order').order('sort_order'),
  ])

  if (!cats || !mods) return []

  return cats.map(cat => ({
    id: cat.id,
    labelKey: `category.${cat.id}.label`,
    subtitleKey: `category.${cat.id}.subtitle`,
    modules: mods.filter(m => m.category_id === cat.id).map(m => m.id),
  }))
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
    supabase.from('module_categories').select('id, sort_order').order('sort_order'),
    supabase
      .from('modules')
      .select('id, category_id, sort_order, is_invite_excluded, preview_kind')
      .order('sort_order'),
  ])

  if (!cats || !mods) return []

  return cats
    .map(cat => ({
      id: cat.id,
      labelKey: `category.${cat.id}.label`,
      subtitleKey: `category.${cat.id}.subtitle`,
      modules: mods
        .filter(m => m.category_id === cat.id && !m.is_invite_excluded && m.preview_kind !== 'coming_soon')
        .map(m => m.id),
    }))
    .filter(cat => cat.modules.length > 0)
}
