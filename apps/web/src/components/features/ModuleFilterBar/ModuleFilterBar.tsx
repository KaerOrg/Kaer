import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/Button'
import { ModuleFilterChip } from './ModuleFilterChip'
import { hasAnyActiveFilter, type ActiveTagFilters } from '../../../lib/moduleFilter'
import type { ModuleTaxonomy } from '../../../services/moduleCatalogService'
import './ModuleFilterBar.css'

const EMPTY_SET: ReadonlySet<string> = new Set()

interface ModuleFilterBarProps {
  taxonomy: ModuleTaxonomy
  activeFilters: ActiveTagFilters
  onToggleTag: (dimensionId: string, tagId: string) => void
  onReset: () => void
  /** Nombre de modules visibles après filtrage / nombre total. */
  resultCount: number
  totalCount: number
}

/**
 * Barre de filtres à facettes de l'armoire thérapeutique : une rangée de puces
 * par dimension (indication, public, approche). Présentationnel — l'état des
 * filtres est possédé par la page. Réutilisable (config armoire + déblocage patient).
 */
export function ModuleFilterBar({
  taxonomy,
  activeFilters,
  onToggleTag,
  onReset,
  resultCount,
  totalCount,
}: ModuleFilterBarProps) {
  const { t } = useTranslation()
  const hasActive = hasAnyActiveFilter(activeFilters)

  return (
    <div className="module-filter-bar">
      {taxonomy.dimensions.map(dimension => {
        const tags = taxonomy.tagsByDimension.get(dimension.id) ?? []
        const selected = activeFilters.get(dimension.id) ?? EMPTY_SET
        if (tags.length === 0) return null
        return (
          <div key={dimension.id} className="module-filter-bar__dimension">
            <span className="module-filter-bar__label">{t(`tag_dimensions.${dimension.id}.label`)}</span>
            <div className="module-filter-bar__chips">
              {tags.map(tag => (
                <ModuleFilterChip
                  key={tag.id}
                  dimensionId={dimension.id}
                  tagId={tag.id}
                  label={t(`tags.${tag.id}.label`)}
                  selected={selected.has(tag.id)}
                  onToggle={onToggleTag}
                />
              ))}
            </div>
          </div>
        )
      })}

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
