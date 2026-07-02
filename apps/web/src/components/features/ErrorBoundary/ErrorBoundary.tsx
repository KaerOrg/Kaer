import { Component, type ErrorInfo, type ReactNode } from 'react'
import { normalizeRoute, reportAppError } from '@services/errorReportingService'
import { ErrorFallback } from './ErrorFallback'

// #96 — Attrape les exceptions de rendu non gérées (composant cassé, hook qui
// throw) qu'aucun `try/catch` classique ne peut intercepter. Les erreurs de
// gestionnaire d'événement ou de promesse ne passent PAS par ici (React ne les
// route pas vers un Error Boundary) — elles sont couvertes par
// `installGlobalErrorHandlers` (`unhandledrejection`). Doit rester une classe :
// `componentDidCatch`/`getDerivedStateFromError` n'ont pas d'équivalent hook.

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportAppError({
      kind: 'crash',
      message: error.message,
      route: normalizeRoute(window.location.pathname),
      stack: error.stack ?? info.componentStack ?? null,
      reason: null,
    })
  }

  render(): ReactNode {
    return this.state.hasError ? <ErrorFallback /> : this.props.children
  }
}
