import { QueryClient } from '@tanstack/react-query'

// Client TanStack Query partagé par toute l'app web praticien.
// Le client Supabase ne cache rien (simple wrapper fetch sur PostgREST) :
// c'est ce QueryClient qui apporte déduplication, cache mémoire et revalidation.
//
// Choix de défauts adaptés à un outil praticien (données peu volatiles, pas de
// flux temps réel) :
//   - staleTime 30 s  : une donnée fraîchement chargée n'est pas re-fetchée si un
//                       autre écran la redemande dans les 30 s (déduplication).
//   - gcTime 5 min    : le cache d'une query inactive est conservé 5 min avant purge.
//   - refetchOnWindowFocus false : pas de re-fetch surprise au retour d'onglet.
//   - retry 1         : une seule re-tentative réseau (le toast d'erreur prend le relais).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
