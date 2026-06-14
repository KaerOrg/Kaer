import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/features/Layout'
import { useToast } from '../../contexts/ToastContext'
import { AdminUsersTable } from './AdminUsersTable'
import { adminQueries } from '../../hooks/queries'
import type { AdminUser } from '../../services/adminService'
import './AdminUsersPage.css'

/**
 * Gestion des utilisateurs (admin uniquement). Liste tous les utilisateurs — patients
 * ET médecins — avec un badge de type, et expose les droits RGPD des patients. L'accès
 * est doublement gardé : route montée seulement si `is_admin` (App.tsx) ET RPC re-gardé
 * `fn_is_admin()` côté base.
 */
export function AdminUsersPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const usersQuery = useQuery(adminQueries.allUsers())

  useEffect(() => {
    if (usersQuery.isError) toast.error(t('admin_users.error_load'))
  }, [usersQuery.isError, toast, t])

  // Effacement réussi (patient) → retirer la ligne du cache sans recharger toute
  // la table (mise à jour optimiste de la donnée déjà en cache).
  const handleErased = useCallback((userId: string) => {
    queryClient.setQueryData<readonly AdminUser[]>(
      adminQueries.allUsers().queryKey,
      prev => (prev ? prev.filter(u => u.user_id !== userId) : prev),
    )
  }, [queryClient])

  return (
    <Layout wide>
      <div className="admin-users">
        <div className="admin-users__header">
          <h1 className="admin-users__title">{t('admin_users.title')}</h1>
        </div>

        {usersQuery.isPending ? (
          <div className="admin-users__loading">{t('common.loading')}</div>
        ) : null}
        {usersQuery.isError ? (
          <div className="admin-users__loading">{t('admin_users.error_load')}</div>
        ) : null}
        {usersQuery.isSuccess ? (
          <AdminUsersTable users={usersQuery.data} onErased={handleErased} />
        ) : null}
      </div>
    </Layout>
  )
}
