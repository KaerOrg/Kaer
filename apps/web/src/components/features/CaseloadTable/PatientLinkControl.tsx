import { useTranslation } from 'react-i18next'
import { Link2, Clock, UserX } from 'lucide-react'
import type { LinkablePatient } from './types'

export interface PatientLinkControlProps {
  patientId: string | null
  invitedEmail: string | null
  patients: readonly LinkablePatient[]
}

/**
 * Statut de liaison à un patient de l'app — lecture seule.
 * La liaison est automatique : patient inscrit → dossier lié ; invitation en attente
 * → dossier libre marqué « invité » (converti en lié à l'inscription).
 */
export function PatientLinkControl({ patientId, invitedEmail, patients }: PatientLinkControlProps) {
  const { t } = useTranslation()

  if (patientId) {
    const linked = patients.find(p => p.id === patientId) ?? null
    return (
      <p className="patient-link patient-link--linked">
        <Link2 size={14} className="patient-link__icon" aria-hidden="true" />
        <span className="patient-link__label">
          {linked ? `${t('file_active.link.linked_prefix')} ${linked.name} — ${linked.email}` : t('file_active.link.linked_unknown')}
        </span>
      </p>
    )
  }

  if (invitedEmail) {
    return (
      <p className="patient-link patient-link--invited">
        <Clock size={14} className="patient-link__icon" aria-hidden="true" />
        {t('file_active.link.invited', { email: invitedEmail })}
      </p>
    )
  }

  return (
    <p className="patient-link patient-link--free">
      <UserX size={14} className="patient-link__icon patient-link__icon--muted" aria-hidden="true" />
      {t('file_active.link.free')}
    </p>
  )
}
