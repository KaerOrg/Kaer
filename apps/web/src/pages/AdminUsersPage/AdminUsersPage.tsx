import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from '../../components/features/Layout'
import { useToast } from '../../contexts/ToastContext'
import { AdminUsersTable } from './AdminUsersTable'
import { fetchAllUsers, type AdminUser } from '../../services/adminService'
import './AdminUsersPage.css'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly users: readonly AdminUser[] }
  | { readonly status: 'error' }

const INITIAL: LoadState = { status: 'loading' }

/**
 * Gestion des utilisateurs (admin uniquement). Liste tous les utilisateurs — patients
 * ET médecins — avec un badge de type, et expose les droits RGPD des patients. L'accès
 * est doublement gardé : route montée seulement si `is_admin` (App.tsx) ET RPC re-gardé
 * `fn_is_admin()` côté base.
 */
export function AdminUsersPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [state, setState] = useState<LoadState>(INITIAL)

  const load = useCallback(async () => {
    const result = await fetchAllUsers()
    if (!result.ok) {
      setState({ status: 'error' })
      toast.error(t('admin_users.error_load'))
      return
    }
    setState({ status: 'ready', users: result.users })
  }, [toast, t])

  useEffect(() => {
    load()
  }, [load])

  // Effacement réussi (patient) → retirer la ligne sans recharger toute la table.
  const handleErased = useCallback((userId: string) => {
    setState(prev =>
      prev.status === 'ready'
        ? { status: 'ready', users: prev.users.filter(u => u.user_id !== userId) }
        : prev
    )
  }, [])

  return (
    <Layout wide>
      <div className="admin-users">
        <div className="admin-users__header">
          <h1 className="admin-users__title">{t('admin_users.title')}</h1>
        </div>

        {state.status === 'loading' ? (
          <div className="admin-users__loading">{t('common.loading')}</div>
        ) : null}
        {state.status === 'error' ? (
          <div className="admin-users__loading">{t('admin_users.error_load')}</div>
        ) : null}
        {state.status === 'ready' ? (
          <AdminUsersTable users={state.users} onErased={handleErased} />
        ) : null}
      </div>
    </Layout>
  )
}
