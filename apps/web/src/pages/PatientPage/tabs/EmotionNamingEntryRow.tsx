// Une ligne de la liste des saisies (maître-détail, #264).
//
// Une saisie sans émotion nommée s'affiche « Sans mot » en italique atténué : c'est
// une entrée LÉGITIME, pas une entrée dégradée. Elle s'ouvre comme les autres.

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { EmotionNamingRow } from '@services/engagementService'

interface Props {
  entry: EmotionNamingRow
  index: number
  selected: boolean
  /** Teinte de la famille : filet d'accent seulement, jamais du texte. */
  accent?: string
  locale: string
  onSelect: (index: number) => void
}

export function EmotionNamingEntryRow({ entry, index, selected, accent, locale, onSelect }: Props) {
  const { t } = useTranslation()
  const handleClick = useCallback(() => onSelect(index), [index, onSelect])

  const label = entry.nuanceCode
    ? [entry.nuanceCode, entry.wordCode]
        .filter((code): code is string => Boolean(code))
        .map(code => t(code))
        .join(' · ')
    : entry.familyCode
      ? t(entry.familyCode)
      : null

  return (
    <li>
      <button
        type="button"
        className={`enl__row ${selected ? 'enl__row--selected' : ''}`}
        style={accent ? { borderLeftColor: accent } : undefined}
        role="option"
        aria-selected={selected}
        aria-controls="enl-detail"
        onClick={handleClick}
        data-testid={`entry-row-${index}`}
      >
        <span className={label ? 'enl__row-title' : 'enl__row-title enl__wordless'}>
          {label ?? t('emotion_naming.wordless')}
        </span>
        <span className="enl__row-meta">
          {new Date(entry.date).toLocaleDateString(locale)}
          {entry.intensity != null ? ` · ${entry.intensity}` : ''}
        </span>
      </button>
    </li>
  )
}
