import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '../../ui/Chip'
import type { ChipTone } from '../../ui/Chip/Chip.types'
import { selectCardTagRows } from '../../../lib/moduleFilter'
import type { ModuleTaxonomy } from '../../../services/moduleCatalogService'
import './ModuleTagChips.css'

const DIMENSION_TONE: Record<string, ChipTone> = {
  indication: 'info',
  population: 'neutral',
}

interface ModuleTagChipsProps {
  /** Tags portés par le module (cf. taxonomy.tagsByModule). */
  tagIds: ReadonlySet<string> | undefined
  taxonomy: Pick<ModuleTaxonomy, 'tagsByDimension'>
}

/**
 * Affiche les tags d'un module sur sa carte, une ligne par dimension
 * (indication, puis public). Présentationnel : aucune logique de données.
 */
export function ModuleTagChips({ tagIds, taxonomy }: ModuleTagChipsProps) {
  const { t } = useTranslation()
  const rows = useMemo(() => selectCardTagRows(tagIds, taxonomy), [tagIds, taxonomy])

  if (rows.length === 0) return null

  return (
    <div className="module-tag-chips">
      {rows.map(row => (
        <div key={row.dimensionId} className="module-tag-chips__row">
          {row.tags.map(tag => (
            <Chip
              key={tag.id}
              size="sm"
              label={t(`tags.${tag.id}.label`)}
              tone={DIMENSION_TONE[row.dimensionId] ?? 'neutral'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
