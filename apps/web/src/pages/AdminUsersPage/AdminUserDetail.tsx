import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Stethoscope, ShieldCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PatientDataRights } from '../../components/features/PatientDataRights'
import type { AdminUser } from '../../services/adminService'

interface AdminUserDetailProps {
  readonly user: AdminUser
  /** Appelé après un effacement réussi (patients uniquement) : la page retire la ligne. */
  readonly onErased: (userId: string) => void
}

/**
 * Panneau dépliable d'une ligne de la table admin. Le contenu dépend du type :
 *   • patient → droits RGPD (export / effacement) via `PatientDataRights` réutilisé ;
 *   • médecin → panneau lecture seule (rôle). Aucune action RGPD patient n'a de sens.
 */
export const AdminUserDetail = memo(function AdminUserDetail({ user, onErased }: AdminUserDetailProps) {
  const { t } = useTranslation()
  const handleErased = useCallback(() => onErased(user.user_id), [onErased, user.user_id])

  if (user.kind === 'patient') {
    return (
      <PatientDataRights
        patientId={user.user_id}
        displayName={user.display_name}
        onErased={handleErased}
      />
    )
  }

  return (
    <Card
      header={{
        icon: <Stethoscope size={18} />,
        title: t('admin_users.practitioner_detail.title'),
        subtitle: user.email,
      }}
    >
      <StatusBadge
        variant={user.is_admin ? 'success' : 'neutral'}
        icon={user.is_admin ? <ShieldCheck size={14} /> : undefined}
        label={user.is_admin ? t('admin_users.role_admin') : t('admin_users.role_practitioner')}
      />
    </Card>
  )
})
