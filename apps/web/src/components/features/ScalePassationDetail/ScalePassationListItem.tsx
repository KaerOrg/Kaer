import { memo, useCallback } from 'react'
import type { ScalePassation } from '@services/engagementService'
import { NO_VALUE } from './passationRows'

interface Props {
  readonly passation: ScalePassation
  readonly index: number
  readonly selected: boolean
  readonly locale: string
  readonly onSelect: (index: number) => void
}

/**
 * Une passation dans la liste latérale : date courte et total brut.
 *
 * Surface de ligne de liste, d'où le `<button>` natif (même cas que
 * `ColumnFormEntryItem`) : ce n'est pas un contrôle habillé en bouton mais la ligne
 * entière rendue cliquable. Aucun style ne dépend du total affiché.
 */
function ScalePassationListItemBase({ passation, index, selected, locale, onSelect }: Props) {
  const handleClick = useCallback(() => onSelect(index), [onSelect, index])

  return (
    <button
      type="button"
      className={`spd-item${selected ? ' spd-item--active' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={handleClick}
    >
      <span className="spd-item__date">
        {new Date(passation.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
      </span>
      <span className="spd-item__score">
        {passation.totalScore != null ? passation.totalScore : NO_VALUE}
      </span>
    </button>
  )
}

export const ScalePassationListItem = memo(ScalePassationListItemBase)
