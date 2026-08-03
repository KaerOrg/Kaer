import type { BreathingPhase } from '@services/breathingService'
import type { LabelFn } from './types'

/** Séparateur des rythmes compacts, aligné sur le reste de l'app (`4s · 7s`). */
const SEPARATOR = ' · '

/**
 * Libellés de rythme d'une technique, un par phase : « 5s inspirer », « 5s expirer ».
 * Sert les puces de la carte principale : le patient lit le tempo avant de démarrer,
 * sans avoir à ouvrir la session.
 */
export function rhythmChipLabels(phases: readonly BreathingPhase[], lbl: LabelFn): string[] {
  return phases.map((phase) => lbl(`hub_rhythm_${phase.type}`, { seconds: phase.seconds }))
}

/**
 * Rythme compact d'une ligne de liste : « 4s · 7s ». Purement numérique (aucun
 * texte à traduire), les durées se lisent dans l'ordre des phases.
 */
export function rhythmSummary(phases: readonly BreathingPhase[]): string {
  return phases.map((phase) => `${phase.seconds}s`).join(SEPARATOR)
}
