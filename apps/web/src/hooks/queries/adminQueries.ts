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
// Préfixe canonique des queries « admin users » (toutes params confondues) : sert à
// invalider en bloc après une écriture (effacement patient) sans réécrire la clé en dur.
const USERS_PREFIX = ['admin', 'users'] as const

export const adminQueries = {
  usersPrefix: USERS_PREFIX,
  users: (params: AdminUsersQuery) =>
    queryOptions({
      queryKey: [...USERS_PREFIX, params],
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
