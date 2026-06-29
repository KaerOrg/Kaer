import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { RemoteSyncService } from '../../services/sync'
import { flushRenderMismatchOutbox } from '../../services/renderDiagnosticsService'

// Déclenche RemoteSyncService.sync() chaque fois que l'app repasse en foreground.
// À monter une seule fois dans le composant Navigation (ou App.tsx).
// No-op si le consentement patient n'est pas activé (gate MDR interne au service).
//
// Draine aussi la file de diagnostics du moteur de rendu (#90) — télémétrie technique,
// NON gatée par le consentement (aucune donnée patient).

export function useSyncOnForeground(): void {
  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void RemoteSyncService.getInstance().sync()
        void flushRenderMismatchOutbox()
      }
    }

    const sub = AppState.addEventListener('change', handleChange)
    return () => sub.remove()
  }, [])
}
