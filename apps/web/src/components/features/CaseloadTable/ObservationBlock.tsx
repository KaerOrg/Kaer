import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/Button'
import { InputField } from '../../ui/InputField'
import type { CaseloadNote } from '../../../lib/caseload.types'

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

export interface ObservationBlockProps {
  entryId: string
  /** Charge les notes du dossier (paresseux : appelé au montage = au dépliage). */
  onLoadNotes: (entryId: string) => Promise<readonly CaseloadNote[]>
  /** Ajoute une note ; renvoie la note créée, ou `null` en cas d'échec. */
  onAddNote: (entryId: string, body: string) => Promise<CaseloadNote | null>
}

/**
 * Observations d'un dossier : la plus récente est affichée, l'historique daté est
 * accessible en un clic. Rien n'est jamais écrasé (journal append-only).
 *
 * Composant **présentationnel** : l'orchestration des données (service, identité
 * praticien, toast) appartient à la page (`FileActivePage`) et entre par les props
 * `onLoadNotes` / `onAddNote`. Le chargement reste paresseux par ligne — le panneau
 * de détail n'est monté qu'au dépliage, donc `onLoadNotes` n'est appelé qu'alors.
 */
export function ObservationBlock({ entryId, onLoadNotes, onAddNote }: ObservationBlockProps) {
  const { t, i18n } = useTranslation()
  const [notes, setNotes] = useState<readonly CaseloadNote[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let active = true
    onLoadNotes(entryId).then(rows => {
      if (active) setNotes(rows)
    })
    return () => {
      active = false
    }
  }, [entryId, onLoadNotes])

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const body = bodyRef.current?.value.trim() ?? ''
      if (!body) return
      setSaving(true)
      const note = await onAddNote(entryId, body)
      setSaving(false)
      if (!note) return
      setNotes(prev => [note, ...prev])
      if (bodyRef.current) bodyRef.current.value = ''
    },
    [entryId, onAddNote]
  )

  const toggleHistory = useCallback(() => setShowHistory(v => !v), [])

  const current = notes[0]
  const history = notes.slice(1)
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(i18n.language, DATE_OPTS)

  return (
    <div className="observation">
      {current ? (
        <div className="observation__current">
          <p className="observation__text">{current.body}</p>
          <span className="observation__date">{formatDate(current.created_at)}</span>
        </div>
      ) : (
        <p className="observation__empty">{t('file_active.observation.empty')}</p>
      )}

      {history.length > 0 ? (
        <button type="button" className="observation__history-toggle" onClick={toggleHistory} aria-expanded={showHistory}>
          {showHistory
            ? t('file_active.observation.history_hide')
            : t('file_active.observation.history_show', { count: history.length })}
        </button>
      ) : null}

      {showHistory ? (
        <ul className="observation__history">
          {history.map(note => (
            <li key={note.id} className="observation__history-item">
              <span className="observation__date">{formatDate(note.created_at)}</span>
              <p className="observation__text">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="observation__add" onSubmit={handleAdd}>
        <InputField
          multiline
          ref={bodyRef}
          rows={2}
          placeholder={t('file_active.observation.add_placeholder')}
          aria-label={t('file_active.observation.add_label')}
        />
        <Button type="submit" size="sm" loading={saving}>
          {t('file_active.observation.add_submit')}
        </Button>
      </form>
    </div>
  )
}
