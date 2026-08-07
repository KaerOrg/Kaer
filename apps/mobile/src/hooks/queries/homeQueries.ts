import { queryOptions } from '@tanstack/react-query'
import {
  fetchUnlockedModules,
  fetchTodayRoutines,
} from '@services/homeService'
import { fetchScaleSchedules } from '@services/scaleScheduleService'
import { getLatestScaleEntry } from '../../lib/database'

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

  /**
   * Programmations du patient + date de sa dernière passation par échelle (#414).
   *
   * Les deux voyagent ensemble parce qu'ils ne servent qu'à une seule chose : dériver
   * la prochaine échéance. Les séparer en deux clés obligerait l'appelant à les
   * recombiner, et ferait deux caches à invalider pour une seule information.
   *
   * La dernière passation est lue en SQLite local, l'ancre devant refléter ce que le
   * patient a réellement saisi, y compris hors ligne.
   */
  scaleDueContext: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['home', 'scaleDueContext', patientId ?? ''],
      queryFn: async () => {
        const schedules = await fetchScaleSchedules(patientId!)
        const lastActivityByModule = new Map<string, string>()
        for (const moduleId of schedules.keys()) {
          const latest = await getLatestScaleEntry(moduleId)
          // `created_at` est un horodatage d'événement : seule sa partie date sert
          // d'ancre, et elle est déjà en heure locale de saisie.
          if (latest != null) lastActivityByModule.set(moduleId, latest.created_at.slice(0, 10))
        }
        return { schedules, lastActivityByModule }
      },
      enabled: patientId != null,
    }),
}
