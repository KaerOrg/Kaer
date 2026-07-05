import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import { injectTheme } from './theme'
import './i18n'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'

injectTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Devtools montés uniquement en dev (tree-shakés du build de prod) : affichent
          chaque query active, sa queryKey et son nombre de fetch → repérer un doublon.
          Voir docs/services.md § « Vérifier qu'un call n'est pas dupliqué ». */}
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </StrictMode>,
)
