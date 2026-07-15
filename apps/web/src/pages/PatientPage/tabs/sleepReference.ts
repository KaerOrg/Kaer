// Fenêtre de référence pour la comparaison de l'agenda du sommeil (page Évolution).
// On extrait les nuits d'une période antérieure et on décale leur date pour les
// aligner sur l'axe de la période courante — la courbe de référence se superpose
// ainsi position par position. Valeurs brutes, aucune interprétation.

import { shiftDate } from '@kaer/shared'
import type { SleepPoint } from '@services/engagementService'

const DAY_MS = 86_400_000

export type ReferenceKind = 'previous' | 'last_year'

/** Décalage (jours) entre la période courante et sa référence. */
export function referenceOffsetDays(mainDays: number, kind: ReferenceKind): number {
  return kind === 'last_year' ? 365 : mainDays
}

/**
 * Nuits de la période de référence, **re-datées** (+offset) pour s'aligner sur
 * l'axe de la période courante `[now - mainDays, now]`.
 * - `previous` : la fenêtre équivalente immédiatement précédente.
 * - `last_year` : la même fenêtre un an plus tôt (profils cycliques).
 */
export function buildReferenceWindow(
  points: SleepPoint[],
  mainDays: number,
  kind: ReferenceKind,
  nowMs: number = Date.now(),
): SleepPoint[] {
  const offset = referenceOffsetDays(mainDays, kind)
  const mainStart = nowMs - mainDays * DAY_MS
  const refStart = mainStart - offset * DAY_MS
  const refEnd = nowMs - offset * DAY_MS
  return points
    .filter(p => {
      const ts = new Date(p.date).getTime()
      return ts >= refStart && ts < refEnd
    })
    .map(p => ({ ...p, date: shiftDate(p.date, offset) }))
}
