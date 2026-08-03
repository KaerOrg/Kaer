// Où mène un tap sur une notification de rappel. Logique pure, testée.
//
// Un rappel qui ouvre l'accueil oblige le patient à retrouver le module puis à
// lancer une saisie : trois gestes pour noter une émotion qui dure dix secondes.
// La notification porte donc le module visé, et le tap ouvre directement la
// première étape de saisie.
//
// Le payload ne transporte AUCUNE donnée de saisie : seulement l'identité du module
// et l'écran à ouvrir. Le texte de la notification, lui, reste constant (MDR).

export interface NotificationTarget {
  readonly moduleType: string
  /** `'entry'` ouvre la saisie ; `'home'` se contente de l'accueil du module. */
  readonly screen: 'entry' | 'home'
}

/** Forme minimale du payload lu sur la réponse à une notification. */
export type NotificationData = Record<string, unknown> | null | undefined

/**
 * Cible du tap, ou `null` si le payload ne dit pas où aller : mieux vaut laisser
 * l'app où elle est que d'ouvrir un module au hasard.
 */
export function parseNotificationTarget(data: NotificationData): NotificationTarget | null {
  if (data == null) return null
  const moduleType = data.module_type
  if (typeof moduleType !== 'string' || moduleType.length === 0) return null
  const screen = data.screen === 'home' ? 'home' : 'entry'
  return { moduleType, screen }
}
