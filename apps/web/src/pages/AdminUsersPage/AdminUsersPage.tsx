import { useTranslation } from 'react-i18next'
import { Layout } from '../../components/features/Layout'
import { AdminUsersTable } from './AdminUsersTable'
import './AdminUsersPage.css'

/**
 * Gestion des utilisateurs (admin uniquement). Liste tous les utilisateurs — patients
 * ET médecins — avec un badge de type, et expose les droits RGPD des patients. L'accès
 * est doublement gardé : route montée seulement si `is_admin` (App.tsx) ET RPC re-gardé
 * `fn_is_admin()` côté base. Filtres / tri / pagination sont gérés côté serveur par
 * `AdminUsersTable` (conteneur).
 */
export function AdminUsersPage() {
  const { t } = useTranslation()

  return (
    <Layout wide>
      <div className="admin-users">
        <div className="admin-users__header">
          <h1 className="admin-users__title">{t('admin_users.title')}</h1>
        </div>
        <AdminUsersTable />
      </div>
    </Layout>
  )
}
