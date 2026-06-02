import { useId, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, Link2Off } from 'lucide-react'
import { SelectField } from '../../ui/SelectField/SelectField'
import type { LinkablePatient } from './types'

export interface PatientLinkControlProps {
  patientId: string | null
  patients: readonly LinkablePatient[]
  onLink: (patientId: string | null) => void
}

/** Relie un dossier à un patient de l'app (par reconnaissance de son email). */
export function PatientLinkControl({ patientId, patients, onLink }: PatientLinkControlProps) {
  const { t } = useTranslation()
  const selectId = useId()
  const linked = patientId ? patients.find(p => p.id === patientId) ?? null : null

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value) onLink(e.target.value)
    },
    [onLink]
  )

  const handleUnlink = useCallback(() => onLink(null), [onLink])

  if (patientId) {
    return (
      <div className="patient-link patient-link--linked">
        <Link2 size={14} className="patient-link__icon" aria-hidden="true" />
        <span className="patient-link__label">
          {linked ? `${linked.name} — ${linked.email}` : t('file_active.link.linked_unknown')}
        </span>
        <button type="button" className="patient-link__unlink" onClick={handleUnlink}>
          <Link2Off size={13} />
          {t('file_active.link.unlink')}
        </button>
      </div>
    )
  }

  if (patients.length === 0) {
    return <p className="patient-link__none">{t('file_active.link.no_patients')}</p>
  }

  return (
    <SelectField label={t('file_active.link.label')} id={selectId} value="" onChange={handleChange}>
      <option value="">{t('file_active.link.placeholder')}</option>
      {patients.map(p => (
        <option key={p.id} value={p.id}>{p.name} — {p.email}</option>
      ))}
    </SelectField>
  )
}
