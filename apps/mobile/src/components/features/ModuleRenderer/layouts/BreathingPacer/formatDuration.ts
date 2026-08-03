import type { LabelFn } from './types'

/** Une minute en secondes : en deçà, la durée se lit en secondes. */
const ONE_MINUTE = 60

/**
 * Durée d'une session en langage courant : « 5 min » au-delà d'une minute,
 * « 45 s » en deçà. Arrondi à la minute la plus proche, jamais vers le haut depuis
 * zéro : une session de 20 secondes reste « 20 s », pas « 1 min ».
 */
export function formatSessionDuration(seconds: number, lbl: LabelFn): string {
  const safe = Math.max(0, Math.round(seconds))
  return safe < ONE_MINUTE
    ? lbl('hub_duration_sec', { count: safe })
    : lbl('hub_duration_min', { count: Math.round(safe / ONE_MINUTE) })
}
