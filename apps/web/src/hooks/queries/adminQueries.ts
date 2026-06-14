import { queryOptions } from '@tanstack/react-query'
import { fetchAllUsers, type AdminUser } from '../../services/adminService'

// Factory `queryOptions` de l'administration des utilisateurs.
// `fetchAllUsers` renvoie un résultat `{ ok, users }` (erreurs non levées) ; on
// lève ici pour que `isError` de la query soit exploitable côté composant.
export const adminQueries = {
  allUsers: () =>
    queryOptions({
      queryKey: ['admin', 'users'],
      queryFn: async (): Promise<readonly AdminUser[]> => {
        const result = await fetchAllUsers()
        if (!result.ok) throw new Error('admin_users_load_failed')
        return result.users
      },
    }),
}
