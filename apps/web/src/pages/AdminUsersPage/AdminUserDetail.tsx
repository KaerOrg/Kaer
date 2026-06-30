import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PatientDataRights } from '../../components/features/PatientDataRights'
import type { AdminUser } from '@services/adminService'

interface AdminUserDetailProps {
  readonly user: AdminUser
  /** Appelé après un effacement réussi (patients uniquement) : la page retire la ligne. */
  readonly onErased: (userId: string) => void
}

/**
 * Corps du panneau latéral (`Drawer`) d'une ligne de la table admin. L'en-tête
 * (nom, email, icône de type) est porté par le `Drawer` ; ce composant n'injecte
 * que le contenu, qui dépend du type :
 *   • patient → droits RGPD (export / effacement) via `PatientDataRights` réutilisé ;
 *   • médecin → badge de rôle en lecture seule. Aucune action RGPD patient n'a de sens.
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
    <StatusBadge
      variant={user.is_admin ? 'success' : 'neutral'}
      icon={user.is_admin ? <ShieldCheck size={14} /> : undefined}
      label={user.is_admin ? t('admin_users.role_admin') : t('admin_users.role_practitioner')}
    />
  )
})
