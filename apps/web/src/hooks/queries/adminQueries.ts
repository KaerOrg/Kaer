import { queryOptions, keepPreviousData } from '@tanstack/react-query'
import {
  fetchUsers,
  fetchPractitionerNames,
  type AdminUsersData,
  type AdminUsersQuery,
} from '@services/adminService'

// Factory `queryOptions` de l'administration des utilisateurs.
// Tri / filtres / pagination sont gérés côté serveur : la `queryKey` embarque tous
// les paramètres pour qu'un changement déclenche un refetch ciblé. `placeholderData`
// conserve la page précédente pendant le chargement de la suivante (pagination fluide).
export const adminQueries = {
  users: (params: AdminUsersQuery) =>
    queryOptions({
      queryKey: ['admin', 'users', params],
      queryFn: async (): Promise<AdminUsersData> => {
        const result = await fetchUsers(params)
        if (!result.ok) throw new Error('admin_users_load_failed')
        return result.data
      },
      placeholderData: keepPreviousData,
    }),

  practitionerNames: () =>
    queryOptions({
      queryKey: ['admin', 'practitioner-names'],
      queryFn: (): Promise<readonly string[]> => fetchPractitionerNames(),
    }),
}
