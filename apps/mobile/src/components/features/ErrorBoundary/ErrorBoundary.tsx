import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportAppError } from '@services/errorReportingService'
import { ErrorFallback } from './ErrorFallback'

// #96 — Attrape les exceptions de rendu non gérées (composant cassé, hook qui
// throw) qu'aucun `try/catch` classique ne peut intercepter. Doit rester une
// classe : `componentDidCatch`/`getDerivedStateFromError` n'ont pas d'équivalent
// hook. Les exceptions JS hors du rendu (handler d'événement, callback async)
// sont couvertes par `ErrorUtils.setGlobalHandler` (câblé dans `App.tsx`), pas
// par ce composant — React ne route pas ces erreurs vers un Error Boundary.
//
// « Réessayer » réinitialise l'état local pour retenter le rendu des enfants
// (pas d'équivalent RN à `window.location.reload()` côté web).

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
    void reportAppError({
      kind: 'crash',
      message: error.message,
      route: null,
      stack: error.stack ?? info.componentStack ?? null,
      reason: null,
    })
  }

  handleRetry = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    return this.state.hasError ? <ErrorFallback onRetry={this.handleRetry} /> : this.props.children
  }
}
