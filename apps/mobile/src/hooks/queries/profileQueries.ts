import { queryOptions } from '@tanstack/react-query'
import { fetchProfileStats } from '@services/profileStatsService'

// Factory `queryOptions` du résumé de suivi (écran Profil patient). Déclare UNE
// FOIS la clé + la fonction de fetch ; toute invalidation réutilise
// `profileQueries.stats(id).queryKey`. Le queryFn appelle un service (jamais
// Supabase direct).
export const profileQueries = {
  stats: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['profile', 'stats', patientId ?? ''],
      queryFn: () => fetchProfileStats(patientId!),
      enabled: patientId != null,
    }),
}
