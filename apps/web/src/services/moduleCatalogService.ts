import { supabase } from '../lib/supabase'
import type { HiddenReason } from '../lib/database.types'

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

// #247. Un module `is_hidden` est retiré de l'app sans être supprimé : il ne doit
// sortir d'AUCUNE lecture de catalogue. Le filtre est posé côté requête, jamais dans
// un composant, pour qu'aucun appelant ne puisse l'oublier.
export async function fetchModuleCategories(): Promise<ModuleCategory[]> {
  const [{ data: cats }, { data: mods }] = await Promise.all([
    supabase.from('module_categories').select('id, sort_order, icon').order('sort_order'),
    supabase
      .from('modules')
      .select('id, category_id, sort_order, icon, mobile_icon, color')
      .eq('is_hidden', false)
      .order('sort_order'),
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
    .eq('is_hidden', false)
    .eq('preview_kind', 'coming_soon')
  return new Set((data ?? []).map(m => m.id))
}

/**
 * Ids des modules masqués (#247) : droits de reproduction non acquis, retirés de
 * l'app sans suppression de code ni de données. Sert aux lectures qui partent des
 * `patient_modules` (déjà débloqués) et ne peuvent donc pas filtrer sur `modules`
 * directement. Table de config, quelques lignes : lecture bon marché.
 */
export async function fetchHiddenModuleIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('modules')
    .select('id')
    .eq('is_hidden', true)
  return new Set((data ?? []).map(m => m.id))
}

/** Un module en veille, avec le motif qui l'y a mis (#406). */
export interface DormantModule {
  readonly id: string
  readonly reason: HiddenReason
}

/**
 * Modules en veille **avec leur motif**, pour la zone « En veille » du praticien (#421).
 *
 * C'est la seule lecture qui les récupère volontairement : partout ailleurs, le filtre
 * `is_hidden = false` les écarte, et il ne doit pas être relâché : ce serait rouvrir la
 * porte que #247 et #406 ferment. Cette liste est **informative**, rien de ce qu'elle
 * rend n'est assignable, et la base refuserait l'assignation de toute façon
 * (`trg_guard_hidden_module_assignment`).
 *
 * Un praticien qui cherche le GAD-7 et ne trouve rien conclut que le produit est pauvre.
 * Lui dire pourquoi transforme un manque en attente. Encore faut-il dire le VRAI motif :
 * annoncer une question de licence devant une échelle libre serait faux.
 */
export async function fetchDormantModules(): Promise<DormantModule[]> {
  const { data } = await supabase
    .from('modules')
    .select('id, hidden_reason')
    .eq('is_hidden', true)
    .order('sort_order')

  const out: DormantModule[] = []
  for (const row of data ?? []) {
    // Un masquage sans motif est interdit par `modules_hidden_reason_ck` ; si une
    // ligne y échappait, on l'ignore plutôt que d'inventer une raison au praticien.
    if (row.hidden_reason != null) out.push({ id: row.id, reason: row.hidden_reason })
  }
  return out
}

export async function fetchInviteCategories(): Promise<ModuleCategory[]> {
  const [{ data: cats }, { data: mods }] = await Promise.all([
    supabase.from('module_categories').select('id, sort_order, icon').order('sort_order'),
    supabase
      .from('modules')
      .select('id, category_id, sort_order, icon, mobile_icon, color, is_invite_excluded, preview_kind')
      .eq('is_hidden', false)
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
