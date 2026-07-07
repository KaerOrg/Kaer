import { memo, useCallback } from 'react'
import type { FormEntryRow } from '@services/engagementService'
import {
  BECK_MOVEMENTS,
  BECK_EMOTION_KEY,
  readMovement,
  formatEntryDateShort,
} from './columnFormData'

interface Props {
  entry: FormEntryRow
  index: number
  selected: boolean
  locale: string
  onSelect: (index: number) => void
}

/**
 * Ligne de la liste latérale des saisies : date courte + libellé d'émotion et
 * mouvement d'intensité brut (« Anxiété 80→40 »). Surface de sélection (ligne de
 * liste) → `<button>` natif légitime, habillage via CSS. Conforme MDR : valeurs
 * brutes, aucun seuil ni couleur de jugement.
 */
function ColumnFormEntryItemBase({ entry, index, selected, locale, onSelect }: Props) {
  const handleClick = useCallback(() => onSelect(index), [onSelect, index])

  const emotion = entry.values[BECK_EMOTION_KEY]
  const { before, after } = readMovement(entry, BECK_MOVEMENTS[0])
  const hasMove = before != null && after != null
  const hasEmotion = typeof emotion === 'string' && emotion.trim() !== ''

  return (
    <button
      type="button"
      className={`cfd-entry${selected ? ' cfd-entry--active' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={handleClick}
    >
      <span className="cfd-entry__date">{formatEntryDateShort(entry.date, locale)}</span>
      {hasEmotion || hasMove ? (
        <span className="cfd-entry__summary">
          {hasEmotion && <span className="cfd-entry__emotion">{emotion}</span>}
          {hasMove && (
            <span className="cfd-entry__move">{before}<span className="cfd-entry__arrow">→</span>{after}</span>
          )}
        </span>
      ) : null}
    </button>
  )
}

export const ColumnFormEntryItem = memo(ColumnFormEntryItemBase)
