import type { ModuleCategory, ModuleTaxonomy, Tag } from '@services/moduleCatalogService'

/**
 * Sélection active de tags, par dimension. Clé = dimension_id, valeur = tags cochés.
 * Sémantique de filtrage : OU à l'intérieur d'une dimension, ET entre dimensions.
 */
export type ActiveTagFilters = ReadonlyMap<string, ReadonlySet<string>>

/** Au moins un tag est-il coché, toutes dimensions confondues ? */
export function hasAnyActiveFilter(activeFilters: ActiveTagFilters): boolean {
  for (const selected of activeFilters.values()) {
    if (selected.size > 0) return true
  }
  return false
}

/**
 * Un module satisfait-il la sélection ? Pour chaque dimension ayant au moins un
 * tag coché, le module doit porter au moins un de ces tags (OU intra-dimension) ;
 * toutes les dimensions actives doivent être satisfaites (ET inter-dimensions).
 */
export function moduleMatchesTagFilters(
  moduleTagIds: ReadonlySet<string> | undefined,
  activeFilters: ActiveTagFilters,
): boolean {
  for (const selected of activeFilters.values()) {
    if (selected.size === 0) continue
    if (!moduleTagIds) return false
    let hit = false
    for (const tagId of selected) {
      if (moduleTagIds.has(tagId)) { hit = true; break }
    }
    if (!hit) return false
  }
  return true
}

/**
 * Filtre les catégories selon les tags actifs. Les catégories vidées de leurs
 * modules sont retirées. Sans filtre actif, renvoie les catégories inchangées.
 */
export function filterCategoriesByTags(
  categories: readonly ModuleCategory[],
  tagsByModule: ReadonlyMap<string, ReadonlySet<string>>,
  activeFilters: ActiveTagFilters,
): ModuleCategory[] {
  if (!hasAnyActiveFilter(activeFilters)) return categories.slice()
  return categories
    .map(cat => ({
      ...cat,
      modules: cat.modules.filter(mod =>
        moduleMatchesTagFilters(tagsByModule.get(mod.id), activeFilters),
      ),
    }))
    .filter(cat => cat.modules.length > 0)
}

/** Dimensions affichées en chips sur la carte d'un module (le reste sert aux filtres). */
const CARD_DIMENSIONS: readonly string[] = ['indication', 'population']

/** Une ligne de puces sur la carte : une dimension + ses tags portés par le module. */
export interface CardTagRow {
  dimensionId: string
  tags: Tag[]
}

/**
 * Tags à afficher sur la carte d'un module, **groupés par dimension** (une ligne
 * indication, une ligne public), dans l'ordre de la taxonomie. Les dimensions sans
 * tag pour ce module sont omises. Pure : utilisée en `useMemo` côté composant.
 */
export function selectCardTagRows(
  moduleTagIds: ReadonlySet<string> | undefined,
  taxonomy: Pick<ModuleTaxonomy, 'tagsByDimension'>,
): CardTagRow[] {
  if (!moduleTagIds || moduleTagIds.size === 0) return []
  const rows: CardTagRow[] = []
  for (const dimensionId of CARD_DIMENSIONS) {
    const dimTags = taxonomy.tagsByDimension.get(dimensionId)
    if (!dimTags) continue
    const tags = dimTags.filter(tag => moduleTagIds.has(tag.id))
    if (tags.length > 0) rows.push({ dimensionId, tags })
  }
  return rows
}
