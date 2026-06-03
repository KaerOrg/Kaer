import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Check, X } from 'lucide-react'

export interface EditableNameProps {
  value: string
  onSave: (next: string) => void
  ariaLabel: string
}

/**
 * Nom du patient en lecture seule par défaut — l'édition demande un clic explicite
 * sur le crayon, puis une validation (Entrée / ✓). Évite toute modification accidentelle.
 */
export function EditableName({ value, onSave, ariaLabel }: EditableNameProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback(() => setEditing(true), [])
  const cancel = useCallback(() => setEditing(false), [])

  const save = useCallback(() => {
    const next = inputRef.current?.value.trim() ?? ''
    if (next && next !== value) onSave(next)
    setEditing(false)
  }, [value, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        save()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    },
    [save, cancel]
  )

  if (!editing) {
    return (
      <div className="editable-name">
        <span className="editable-name__text" title={value}>{value}</span>
        <button
          type="button"
          className="editable-name__edit"
          onClick={startEdit}
          aria-label={t('file_active.name.edit')}
        >
          <Pencil size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="editable-name editable-name--editing">
      <input
        ref={inputRef}
        className="editable-name__input"
        defaultValue={value}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        autoFocus
      />
      <button
        type="button"
        className="editable-name__btn editable-name__btn--save"
        onMouseDown={e => e.preventDefault()}
        onClick={save}
        aria-label={t('common.save')}
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        className="editable-name__btn"
        onMouseDown={e => e.preventDefault()}
        onClick={cancel}
        aria-label={t('common.cancel')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
