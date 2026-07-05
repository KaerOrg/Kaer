import type { ReactElement, ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Rend un composant enveloppé d'un `QueryClientProvider` neuf (cache isolé par test,
 * `retry: false`). À utiliser pour tout composant qui consomme `useQuery` — sinon
 * React Query lève « No QueryClient set ».
 *
 * Le provider est passé via l'option `wrapper` : `rerender` conserve donc le même
 * client (indispensable aux tests qui changent une prop et re-rendent). Retourne le
 * `RenderResult` plus le `queryClient` utilisé.
 *
 * Passer un `client` existant permet de partager le cache entre deux rendus (test de
 * déduplication : un 2e montage ne doit pas re-fetcher une donnée déjà en cache).
 */
export function renderWithClient(
  ui: ReactElement,
  client?: QueryClient,
): RenderResult & { queryClient: QueryClient } {
  const queryClient = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const result = render(ui, { wrapper })
  return { ...result, queryClient }
}
