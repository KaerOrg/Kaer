import type { UnlockedModule } from '@services/homeService'

// Ordre des catégories — miroir de sort_order dans module_categories en base.
const CATEGORY_ORDER = [
  'safety', 'iatrogenic', 'lifestyle', 'emotion',
  'cognitive', 'anxiety', 'addiction', 'motivation', 'assessments',
]

export interface ModuleGroup {
  catId: string
  items: UnlockedModule[]
}

/**
 * Regroupe les modules débloqués par catégorie, dans l'ordre `CATEGORY_ORDER`
 * (miroir de `module_categories.sort_order`), les catégories inconnues étant
 * ajoutées à la fin dans leur ordre d'apparition. Fonction pure : aucune donnée
 * n'est interprétée, seul l'ordre d'affichage est calculé.
 */
export function groupModulesByCategory(modules: UnlockedModule[]): ModuleGroup[] {
  const grouped = new Map<string, UnlockedModule[]>()
  for (const mod of modules) {
    const catId = mod.module?.category_id ?? 'other'
    const bucket = grouped.get(catId)
    if (bucket) bucket.push(mod)
    else grouped.set(catId, [mod])
  }

  const ordered = CATEGORY_ORDER
    .filter(id => grouped.has(id))
    .map(id => ({ catId: id, items: grouped.get(id)! }))
  const rest = [...grouped.entries()]
    .filter(([id]) => !CATEGORY_ORDER.includes(id))
    .map(([catId, items]) => ({ catId, items }))

  return [...ordered, ...rest]
}
