import { queryOptions } from '@tanstack/react-query'
import { getActivityFeed } from '@services/notificationRoutineService'

// Fil d'activité du praticien (événements récents : rappels mis en pause par les
// patients…). Donnée volatile → `staleTime` par défaut (rafraîchi au focus d'onglet),
// jamais de cache long. Clé par praticien.
export const activityFeedQueries = {
  feed: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['activityFeed', practitionerId ?? ''],
      queryFn: () => getActivityFeed(practitionerId!),
      enabled: !!practitionerId,
    }),
}
