// Maître-détail des saisies du module « Nommer ce que je ressens » (bas de l'écran
// 1a, ticket #264).
//
// Le champ le plus riche cliniquement est le texte libre « Qu'est-ce qui s'est passé ? ».
// Il lui faut la même dignité qu'aux colonnes de Beck : une liste à gauche, la fiche
// complète à droite, et la note affichée INTÉGRALEMENT, sans troncature ni « voir plus ».
//
// Conformité MDR : l'intensité est un chiffre brut rendu en crans remplis. Aucun
// label interprétatif (« fort », « sévère »), aucune couleur de seuil. Une saisie sans
// intensité n'affiche AUCUN cran — surtout pas un zéro, qui serait une valeur que le
// patient n'a pas donnée.

import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '@ui/Chip'
import type { EmotionNamingRow } from '@services/engagementService'
import { EmotionNamingEntryRow } from './EmotionNamingEntryRow'
import './EmotionNamingEntryList.css'

interface Props {
  /** Saisies de la fenêtre courante, ordre chronologique croissant. */
  entries: EmotionNamingRow[]
  /** Teinte de chaque famille (identité), pour le filet d'accent. */
  colorByFamily: Record<string, string>
  /** Borne haute de l'échelle, lue en config : « 4 / 5 ». */
  intensityMax: number
  locale: string
}

export function EmotionNamingEntryList({ entries, colorByFamily, intensityMax, locale }: Props) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [notesOnly, setNotesOnly] = useState(false)

  // La plus récente en haut : c'est celle dont on parle en séance.
  const ordered = useMemo(() => [...entries].reverse(), [entries])
  const withNotes = useMemo(() => ordered.filter(e => (e.notes ?? '').trim().length > 0), [ordered])
  const visible = notesOnly ? withNotes : ordered

  const toggleNotesOnly = useCallback(() => {
    setNotesOnly(prev => !prev)
    setSelectedIndex(0)
  }, [])

  const selected = visible[Math.min(selectedIndex, visible.length - 1)]

  if (visible.length === 0 && !notesOnly) return null

  return (
    <section className="enl" aria-label={t('emotion_naming.entries_title')}>
      <header className="enl__header">
        <span className="enl__count">
          {t('emotion_naming.entries_count', { count: ordered.length })}
        </span>
        <Chip
          label={t('emotion_naming.filter_with_notes', { count: withNotes.length })}
          size="sm"
          selectable
          selected={notesOnly}
          onClick={toggleNotesOnly}
        />
      </header>

      <div className="enl__body">
        <ul className="enl__list" role="listbox" aria-label={t('emotion_naming.entries_title')}>
          {visible.map((entry, index) => (
            <EmotionNamingEntryRow
              key={`${entry.date}-${index}`}
              entry={entry}
              index={index}
              selected={index === selectedIndex}
              accent={entry.familyCode ? colorByFamily[entry.familyCode] : undefined}
              locale={locale}
              onSelect={setSelectedIndex}
            />
          ))}
        </ul>

        {selected ? (
          <article
            className="enl__detail"
            id="enl-detail"
            aria-live="polite"
            data-testid="entry-detail"
            style={selected.familyCode && colorByFamily[selected.familyCode]
              ? { borderLeftColor: colorByFamily[selected.familyCode] }
              : undefined}
          >
            <p className="enl__path" data-testid="entry-path">
              {selected.familyCode
                ? [selected.familyCode, selected.nuanceCode, selected.wordCode]
                    .filter((code): code is string => Boolean(code))
                    .map(code => t(code))
                    .join(' › ')
                : <span className="enl__wordless">{t('emotion_naming.wordless')}</span>}
            </p>
            <p className="enl__date">{new Date(selected.date).toLocaleString(locale)}</p>

            {selected.context.length > 0 || selected.contextOther ? (
              <div className="enl__chips">
                {selected.context.map(code => <Chip key={code} label={t(code)} size="sm" />)}
                {selected.contextOther ? <Chip label={selected.contextOther} size="sm" /> : null}
              </div>
            ) : null}

            {selected.intensity != null ? (
              <div className="enl__intensity" data-testid="entry-intensity">
                <span className="enl__section-label">{t('emotion_naming.intensity')}</span>
                <span className="enl__steps" aria-hidden="true">
                  {Array.from({ length: intensityMax }, (_, i) => (
                    <span
                      key={i}
                      className={`enl__step ${i < (selected.intensity ?? 0) ? 'enl__step--on' : ''}`}
                    />
                  ))}
                </span>
                <span className="enl__intensity-value">
                  {selected.intensity} / {intensityMax}
                </span>
              </div>
            ) : null}

            {selected.notes ? (
              <div className="enl__notes">
                <span className="enl__section-label">{t('emotion_naming.notes_title')}</span>
                {/* Intégrale, jamais tronquée : c'est le champ le plus riche. */}
                <p className="enl__notes-body">{selected.notes}</p>
              </div>
            ) : null}
          </article>
        ) : (
          <p className="enl__empty">{t('emotion_naming.no_note_entry')}</p>
        )}
      </div>
    </section>
  )
}

