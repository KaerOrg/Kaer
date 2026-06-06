import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '../../ui/Button'

export interface AddEntryFormProps {
  onCreate: (input: { display_name: string; action_label: string | null; action_due: string | null }) => void
  loading?: boolean
}

/**
 * Capture rapide d'un dossier — un nom, une première action, une date, entrée.
 * Inputs non contrôlés : la valeur n'est lue qu'à la validation (zéro re-render à la frappe).
 */
export function AddEntryForm({ onCreate, loading = false }: AddEntryFormProps) {
  const { t } = useTranslation()
  const nameRef = useRef<HTMLInputElement>(null)
  const actionRef = useRef<HTMLInputElement>(null)
  const dueRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const name = nameRef.current?.value.trim() ?? ''
      if (!name) {
        nameRef.current?.focus()
        return
      }
      onCreate({
        display_name: name,
        action_label: actionRef.current?.value.trim() || null,
        action_due: dueRef.current?.value || null,
      })
      if (nameRef.current) nameRef.current.value = ''
      if (actionRef.current) actionRef.current.value = ''
      if (dueRef.current) dueRef.current.value = ''
      nameRef.current?.focus()
    },
    [onCreate]
  )

  return (
    <form className="caseload-add" onSubmit={handleSubmit}>
      <input
        ref={nameRef}
        className="caseload-add__name"
        placeholder={t('file_active.add.name_placeholder')}
        aria-label={t('file_active.add.name_label')}
      />
      <input
        ref={actionRef}
        className="caseload-add__action"
        placeholder={t('file_active.add.action_placeholder')}
        aria-label={t('file_active.add.action_label')}
      />
      <input
        ref={dueRef}
        type="date"
        className="caseload-add__due"
        aria-label={t('file_active.add.due_label')}
      />
      <Button type="submit" size="sm" loading={loading}>
        <Plus size={15} />
        {t('file_active.add.submit')}
      </Button>
    </form>
  )
}
