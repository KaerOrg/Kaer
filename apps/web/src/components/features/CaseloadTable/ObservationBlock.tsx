import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '../../ui/Button'
import { fetchCaseloadNotes, createCaseloadNote } from '../../../services/caseloadService'
import type { CaseloadNote } from '../../../lib/caseload.types'

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/**
 * Observations d'un dossier : la plus récente est affichée, l'historique daté est
 * accessible en un clic. Rien n'est jamais écrasé (journal append-only).
 * Composant auto-suffisant : charge ses notes au montage (lazy, scalable).
 */
export function ObservationBlock({ entryId }: { entryId: string }) {
  const { t, i18n } = useTranslation()
  const { practitioner } = useAuthStore()
  const toast = useToast()
  const [notes, setNotes] = useState<CaseloadNote[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let active = true
    fetchCaseloadNotes(entryId).then(rows => {
      if (active) setNotes(rows)
    })
    return () => {
      active = false
    }
  }, [entryId])

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const body = bodyRef.current?.value.trim() ?? ''
      if (!body || !practitioner) return
      setSaving(true)
      const result = await createCaseloadNote(practitioner.id, entryId, body)
      setSaving(false)
      if (!result.ok || !result.note) {
        toast.error(t('file_active.observation.error'))
        return
      }
      const note = result.note
      setNotes(prev => [note, ...prev])
      if (bodyRef.current) bodyRef.current.value = ''
    },
    [practitioner, entryId, toast, t]
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
        <textarea
          ref={bodyRef}
          className="observation__input"
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
