import { useCallback, useEffect, useState } from 'react'
import { fetchModuleTaxonomy, type ModuleTaxonomy } from '../services/moduleCatalogService'

const EMPTY_TAXONOMY: ModuleTaxonomy = { dimensions: [], tagsByDimension: new Map(), tagsByModule: new Map() }

/**
 * État des filtres par facettes de l'armoire thérapeutique : charge la taxonomie
 * (axes + tags + liaisons modules) au mount et possède la sélection active.
 * Sémantique : OU à l'intérieur d'une dimension, ET entre dimensions (le filtrage
 * lui-même est dans `lib/moduleFilter.ts`). Partagé entre l'armoire de configuration
 * (ModuleCatalogPage) et l'onglet Modules d'un patient (PatientModulesTab).
 */
export function useTagFilters() {
  const [taxonomy, setTaxonomy] = useState<ModuleTaxonomy>(EMPTY_TAXONOMY)
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(new Map())

  useEffect(() => {
    fetchModuleTaxonomy().then(setTaxonomy)
  }, [])

  const toggleTag = useCallback((dimensionId: string, tagId: string) => {
    setActiveFilters(prev => {
      const next = new Map(prev)
      const selected = new Set(next.get(dimensionId))
      if (selected.has(tagId)) { selected.delete(tagId) } else { selected.add(tagId) }
      if (selected.size === 0) { next.delete(dimensionId) } else { next.set(dimensionId, selected) }
      return next
    })
  }, [])

  const resetFilters = useCallback(() => setActiveFilters(new Map()), [])

  return { taxonomy, activeFilters, toggleTag, resetFilters }
}
