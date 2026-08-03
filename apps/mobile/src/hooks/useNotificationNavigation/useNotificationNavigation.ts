import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { parseNotificationTarget } from './notificationTarget'

/** Ouvre un module. `startEntry` demande la saisie plutôt que l'accueil. */
export type OpenModule = (moduleType: string, startEntry: boolean) => void

/**
 * Tap sur une notification de rappel : ouvre directement la saisie du module visé,
 * sans passer par l'accueil.
 *
 * Un rappel qui atterrit sur l'accueil oblige le patient à retrouver le module puis
 * à lancer une saisie : trois gestes pour noter une émotion qui en dure dix
 * secondes. Le payload porte donc le module ; sans lui, on ne navigue nulle part
 * plutôt que d'ouvrir un module au hasard.
 *
 * `getLastNotificationResponseAsync` couvre le cas « app fermée, réveillée par le
 * tap » ; le listener couvre « app déjà lancée ». Le hook ne connaît pas
 * react-navigation : il reçoit l'ouverture en callback, et reste testable seul.
 */
export function useNotificationNavigation(openModule: OpenModule | null): void {
  useEffect(() => {
    if (!openModule) return

    const go = (data: Record<string, unknown> | null | undefined) => {
      const target = parseNotificationTarget(data)
      if (!target) return
      openModule(target.moduleType, target.screen === 'entry')
    }

    // App réveillée par le tap : la réponse est déjà là au montage.
    void Notifications.getLastNotificationResponseAsync?.()
      .then(response => {
        if (response) go(response.notification.request.content.data)
      })
      .catch(() => { /* pas de navigation : l'app reste où elle est */ })

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      go(response.notification.request.content.data)
    })
    return () => subscription.remove()
  }, [openModule])
}
