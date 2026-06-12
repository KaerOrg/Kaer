import { QueryClient } from '@tanstack/react-query'

// Client TanStack Query partagé par l'app patient.
// Il ne concerne QUE les lectures réseau (Supabase) : modules débloqués, routines
// du jour, fiches psyedu, profil… Les saisies patient restent en SQLite local
// (offline-first via syncHelpers) et ne passent PAS par ce cache.
//
// Défauts adaptés au mobile (réseau intermittent, données de config peu volatiles) :
//   - staleTime 60 s  : déduplication entre écrans, pas de re-fetch au remontage immédiat.
//   - gcTime 10 min   : cache conservé plus longtemps qu'en web (sessions plus courtes).
//   - retry 2         : réseau mobile plus instable → une re-tentative de plus.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 2,
    },
  },
})
