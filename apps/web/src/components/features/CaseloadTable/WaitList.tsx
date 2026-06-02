import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { WaitItem } from './WaitItem'
import type { CaseloadWait, CaseloadWaitInput } from '../../../lib/caseload.types'

export interface WaitListProps {
  waits: readonly CaseloadWait[]
  onAdd: (label: string, relance: string | null) => void
  onPatch: (waitId: string, patch: CaseloadWaitInput) => void
  onDelete: (waitId: string) => void
}

export function WaitList({ waits, onAdd, onPatch, onDelete }: WaitListProps) {
  const { t } = useTranslation()
  const labelRef = useRef<HTMLInputElement>(null)
  const relanceRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const label = labelRef.current?.value.trim() ?? ''
      if (!label) {
        labelRef.current?.focus()
        return
      }
      onAdd(label, relanceRef.current?.value || null)
      if (labelRef.current) labelRef.current.value = ''
      if (relanceRef.current) relanceRef.current.value = ''
      labelRef.current?.focus()
    },
    [onAdd]
  )

  return (
    <div className="wait-list">
      {waits.length === 0 ? (
        <p className="wait-list__empty">{t('file_active.wait.empty')}</p>
      ) : (
        waits.map(wait => <WaitItem key={wait.id} wait={wait} onPatch={onPatch} onDelete={onDelete} />)
      )}

      <form className="wait-list__add" onSubmit={handleAdd}>
        <input
          ref={labelRef}
          className="wait-list__add-label"
          placeholder={t('file_active.wait.add_placeholder')}
          aria-label={t('file_active.wait.add_label')}
        />
        <span className="wait-item__relance-label">{t('file_active.wait.relance_prefix')}</span>
        <input
          ref={relanceRef}
          type="date"
          className="wait-list__add-relance"
          aria-label={t('file_active.wait.add_relance_label')}
        />
        <button type="submit" className="wait-list__add-btn" aria-label={t('file_active.wait.add_submit')}>
          <Plus size={14} />
        </button>
      </form>
    </div>
  )
}
