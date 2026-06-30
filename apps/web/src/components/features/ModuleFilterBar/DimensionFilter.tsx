import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, type DropdownOption } from '../../ui/Dropdown'
import type { Tag } from '@services/moduleCatalogService'

interface DimensionFilterProps {
  dimensionId: string
  /** Libellé de l'axe (indication, public, approche), affiché en en-tête. */
  label: string
  /** Tags de cet axe, déjà triés. */
  tags: readonly Tag[]
  /** Tags cochés pour cet axe. */
  selected: ReadonlySet<string>
  onToggleTag: (dimensionId: string, tagId: string) => void
  selectPlaceholder: string
  emptyText: string
}

/**
 * Une combobox d'autocomplétion pour un seul axe de filtrage. Mémoïsée, avec un
 * `onToggle` stable lié à sa dimension — un filtre par axe, pas de callback
 * recréé à chaque rendu de la barre.
 */
function DimensionFilterBase({
  dimensionId,
  label,
  tags,
  selected,
  onToggleTag,
  selectPlaceholder,
  emptyText,
}: DimensionFilterProps) {
  const { t } = useTranslation()
  const options = useMemo<DropdownOption[]>(
    () => tags.map(tag => ({ value: tag.id, label: t(`tags.${tag.id}.label`) })),
    [tags, t],
  )

  const handleToggle = useCallback(
    (tagId: string) => onToggleTag(dimensionId, tagId),
    [onToggleTag, dimensionId],
  )

  return (
    <label className="dimension-filter">
      <span className="dimension-filter__label">{label}</span>
      <Dropdown
        mode="multiple"
        options={options}
        selectedValues={selected}
        onToggle={handleToggle}
        placeholder={selectPlaceholder}
        ariaLabel={label}
        emptyText={emptyText}
      />
    </label>
  )
}

export const DimensionFilter = memo(DimensionFilterBase)
