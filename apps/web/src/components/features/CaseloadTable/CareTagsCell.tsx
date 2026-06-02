import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

export interface CareTagsCellProps {
  pathways: readonly string[]
  onChange: (next: string[]) => void
}

/** Éditeur d'étiquettes « Soins en cours » — chips ajoutables/supprimables. */
export function CareTagsCell({ pathways, onChange }: CareTagsCellProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback(() => {
    const value = inputRef.current?.value.trim()
    if (inputRef.current) inputRef.current.value = ''
    if (!value || pathways.includes(value)) return
    onChange([...pathways, value])
  }, [pathways, onChange])

  const removeTag = useCallback(
    (tag: string) => onChange(pathways.filter(p => p !== tag)),
    [pathways, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addTag()
      }
    },
    [addTag]
  )

  return (
    <div className="care-tags">
      {pathways.map(tag => (
        <span key={tag} className="care-tag">
          {tag}
          <button
            type="button"
            className="care-tag__remove"
            onClick={() => removeTag(tag)}
            aria-label={t('file_active.care.remove', { tag })}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="care-tag__input"
        placeholder={t('file_active.care.add_placeholder')}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        aria-label={t('file_active.care.add_label')}
      />
    </div>
  )
}
