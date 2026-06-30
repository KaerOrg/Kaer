import { useCallback, useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SearchInput } from '../../ui/SearchInput'
import { hasAnyActiveFilter, type ActiveTagFilters } from '../../../lib/moduleFilter'
import type { ModuleTaxonomy } from '@services/moduleCatalogService'
import { DimensionFilter } from './DimensionFilter'
import './ModuleFilterBar.css'

/** Recherche texte optionnelle, rendue dans le même panneau que les critères. */
export interface ModuleFilterSearch {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

interface ModuleFilterBarProps {
  taxonomy: ModuleTaxonomy
  activeFilters: ActiveTagFilters
  onToggleTag: (dimensionId: string, tagId: string) => void
  onReset: () => void
  /** Nombre de modules visibles après filtrage / nombre total. */
  resultCount: number
  totalCount: number
  /** Recherche par mot-clé, affichée en tête du panneau. Omise → pas de recherche. */
  search?: ModuleFilterSearch
}

/** Un tag sélectionné, prêt à être rendu en puce supprimable. */
interface SelectedTag {
  tagId: string
  label: string
}

/** Les tags sélectionnés d'un axe, regroupés sous le titre du critère. */
interface SelectedGroup {
  dimensionId: string
  label: string
  tags: SelectedTag[]
}

const EMPTY_SET: ReadonlySet<string> = new Set()

/**
 * Panneau de filtres à facettes de l'armoire thérapeutique : une recherche par
 * mot-clé optionnelle, une combobox d'autocomplétion **par dimension** (indication,
 * public, approche), puis une zone de puces supprimables résumant la sélection,
 * regroupées sous le titre de leur critère. Présentationnel — l'état des filtres
 * est possédé par la page. Réutilisable (config armoire + déblocage patient).
 */
export function ModuleFilterBar({
  taxonomy,
  activeFilters,
  onToggleTag,
  onReset,
  resultCount,
  totalCount,
  search,
}: ModuleFilterBarProps) {
  const { t } = useTranslation()
  const hasActive = hasAnyActiveFilter(activeFilters)

  // Nombre d'axes affichés (dimensions ayant au moins un tag) : exposé en variable
  // CSS pour caler la recherche sur la largeur d'une colonne de filtre.
  const visibleDimensionCount = useMemo(
    () => taxonomy.dimensions.filter(d => (taxonomy.tagsByDimension.get(d.id)?.length ?? 0) > 0).length,
    [taxonomy],
  )
  const barStyle = useMemo<CSSProperties>(
    () => ({ '--filter-cols': Math.max(visibleDimensionCount, 1) } as CSSProperties),
    [visibleDimensionCount],
  )

  // Tags cochés, regroupés par axe (titre du critère rappelé), dans l'ordre de
  // la taxonomie.
  const selectedGroups = useMemo<SelectedGroup[]>(() => {
    const out: SelectedGroup[] = []
    for (const dimension of taxonomy.dimensions) {
      const selected = activeFilters.get(dimension.id)
      if (!selected || selected.size === 0) continue
      const tags: SelectedTag[] = []
      for (const tag of taxonomy.tagsByDimension.get(dimension.id) ?? []) {
        if (selected.has(tag.id)) tags.push({ tagId: tag.id, label: t(`tags.${tag.id}.label`) })
      }
      if (tags.length > 0) {
        out.push({ dimensionId: dimension.id, label: t(`tag_dimensions.${dimension.id}.label`), tags })
      }
    }
    return out
  }, [taxonomy, activeFilters, t])

  const handleRemove = useCallback(
    (dimensionId: string, tagId: string) => onToggleTag(dimensionId, tagId),
    [onToggleTag],
  )

  return (
    <div className="module-filter-bar" style={barStyle}>
      {search ? (
        <div className="module-filter-bar__search">
          <SearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
          />
        </div>
      ) : null}

      <div className="module-filter-bar__filters">
        {taxonomy.dimensions.map(dimension => {
          const tags = taxonomy.tagsByDimension.get(dimension.id) ?? []
          if (tags.length === 0) return null
          return (
            <DimensionFilter
              key={dimension.id}
              dimensionId={dimension.id}
              label={t(`tag_dimensions.${dimension.id}.label`)}
              tags={tags}
              selected={activeFilters.get(dimension.id) ?? EMPTY_SET}
              onToggleTag={onToggleTag}
              selectPlaceholder={t('modules.filter_select')}
              emptyText={t('modules.filter_no_match')}
            />
          )
        })}
      </div>

      {selectedGroups.length > 0 ? (
        <div className="module-filter-bar__selected">
          {selectedGroups.map(group => (
            <div key={group.dimensionId} className="module-filter-bar__selected-group">
              <span className="module-filter-bar__selected-label">{group.label}</span>
              <div className="module-filter-bar__selected-chips">
                {group.tags.map(tag => (
                  <Chip
                    key={tag.tagId}
                    label={tag.label}
                    onRemove={() => handleRemove(group.dimensionId, tag.tagId)}
                    removeLabel={t('modules.filter_remove', { tag: tag.label })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="module-filter-bar__footer">
        <span className="module-filter-bar__count">
          {t('modules.filter_count', { shown: resultCount, total: totalCount })}
        </span>
        {hasActive ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t('modules.filter_reset')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
