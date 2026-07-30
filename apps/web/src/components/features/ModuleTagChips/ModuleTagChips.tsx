import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '../../ui/Chip'
import type { ChipTone } from '../../ui/Chip/Chip.types'
import { selectCardTagRows } from '../../../lib/moduleFilter'
import type { ModuleTaxonomy } from '@services/moduleCatalogService'
import './ModuleTagChips.css'

const DIMENSION_TONE: Record<string, ChipTone> = {
  indication: 'info',
  population: 'neutral',
}

interface ModuleTagChipsProps {
  /** Tags portés par le module (cf. taxonomy.tagsByModule). */
  tagIds: ReadonlySet<string> | undefined
  taxonomy: Pick<ModuleTaxonomy, 'tagsByDimension'>
  /**
   * Dimensions à rendre. Par défaut celles de la carte (indication seule) ; le
   * panneau Sources, plus large, passe `PANEL_DIMENSIONS` pour ajouter le public.
   */
  dimensions?: readonly string[]
  /** Précède chaque ligne du libellé de sa dimension (`tag_dimensions.<id>.label`). */
  showDimensionLabels?: boolean
}

/**
 * Affiche les tags d'un module, une ligne par dimension (indication, puis public).
 * Présentationnel : aucune logique de données. Source unique des puces d'indication,
 * sur la carte du module comme dans le panneau Sources.
 */
export function ModuleTagChips({ tagIds, taxonomy, dimensions, showDimensionLabels = false }: ModuleTagChipsProps) {
  const { t } = useTranslation()
  const rows = useMemo(
    () => selectCardTagRows(tagIds, taxonomy, dimensions),
    [tagIds, taxonomy, dimensions],
  )

  if (rows.length === 0) return null

  return (
    <div className="module-tag-chips">
      {rows.map(row => (
        <div key={row.dimensionId} className="module-tag-chips__group">
          {showDimensionLabels ? (
            <span className="module-tag-chips__dimension">
              {t(`tag_dimensions.${row.dimensionId}.label`)}
            </span>
          ) : null}
          <div className="module-tag-chips__row">
          {row.tags.map(tag => (
            <Chip
              key={tag.id}
              size="sm"
              label={t(`tags.${tag.id}.label`)}
              tone={DIMENSION_TONE[row.dimensionId] ?? 'neutral'}
            />
          ))}
          </div>
        </div>
      ))}
    </div>
  )
}
