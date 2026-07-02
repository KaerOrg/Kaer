import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { injectTheme } from './theme'
import './i18n'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'
import { ErrorBoundary } from './components/features/ErrorBoundary'
import { installGlobalErrorHandlers } from './services/errorReportingService'

injectTheme()
installGlobalErrorHandlers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
