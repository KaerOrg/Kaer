import { queryOptions } from '@tanstack/react-query'
import {
  fetchUnlockedModules,
  fetchTodayRoutines,
} from '../../services/homeService'

// Factories `queryOptions` de l'écran d'accueil patient.
// Chaque entrée déclare UNE FOIS la clé + la fonction de fetch. Les composants
// font `useQuery(homeQueries.unlockedModules(id))` ; toute invalidation réutilise
// `homeQueries.unlockedModules(id).queryKey`. Le queryFn appelle TOUJOURS un
// service (jamais Supabase direct) — la règle « zéro Supabase hors service » tient.
export const homeQueries = {
  unlockedModules: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['home', 'unlockedModules', patientId ?? ''],
      queryFn: () => fetchUnlockedModules(patientId!),
      enabled: patientId != null,
    }),

  todayRoutines: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['home', 'todayRoutines', patientId ?? ''],
      queryFn: () => fetchTodayRoutines(patientId!),
      enabled: patientId != null,
    }),
}
