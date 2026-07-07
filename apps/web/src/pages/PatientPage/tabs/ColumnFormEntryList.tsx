import { memo } from 'react'
import type { FormEntryRow } from '@services/engagementService'
import { ColumnFormEntryItem } from './ColumnFormEntryItem'

interface Props {
  entries: FormEntryRow[]
  selectedIndex: number
  locale: string
  title: string
  onSelect: (index: number) => void
}

/** Liste latérale des saisies (antichronologique), sélection de la fiche active. */
function ColumnFormEntryListBase({ entries, selectedIndex, locale, title, onSelect }: Props) {
  return (
    <nav className="cfd-list" aria-label={title}>
      <h4 className="cfd-list__title">{title}</h4>
      {entries.map((entry, i) => (
        <ColumnFormEntryItem
          key={`${entry.date}-${i}`}
          entry={entry}
          index={i}
          selected={i === selectedIndex}
          locale={locale}
          onSelect={onSelect}
        />
      ))}
    </nav>
  )
}

export const ColumnFormEntryList = memo(ColumnFormEntryListBase)
