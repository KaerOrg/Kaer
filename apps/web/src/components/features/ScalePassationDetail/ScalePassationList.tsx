import { memo } from 'react'
import type { ScalePassation } from '@services/engagementService'
import { ScalePassationListItem } from './ScalePassationListItem'
import './ScalePassationList.css'

interface Props {
  /** Passations dans l'ordre antichronologique, la plus récente en tête. */
  readonly passations: readonly ScalePassation[]
  readonly selectedIndex: number
  readonly locale: string
  readonly title: string
  readonly onSelect: (index: number) => void
}

/** Liste latérale des passations : sélectionne celle dont le détail est affiché. */
function ScalePassationListBase({ passations, selectedIndex, locale, title, onSelect }: Props) {
  return (
    <nav className="spd-list" aria-label={title}>
      <h4 className="spd-list__title">{title}</h4>
      {passations.map((passation, i) => (
        <ScalePassationListItem
          key={passation.id}
          passation={passation}
          index={i}
          selected={i === selectedIndex}
          locale={locale}
          onSelect={onSelect}
        />
      ))}
    </nav>
  )
}

export const ScalePassationList = memo(ScalePassationListBase)
