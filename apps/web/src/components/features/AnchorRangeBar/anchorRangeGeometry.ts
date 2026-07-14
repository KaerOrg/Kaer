// Géométrie pure de la « barre de plage » (min → max sur un axe 0 h → 24 h).
// Les horaires arrivent en minutes DÉROULÉES (autour de la moyenne circulaire, cf.
// buildRhythmogram) : une plage peut franchir minuit. Aucune dépendance React.

const DAY = 1440

/** Position horaire d'un horaire (minutes déroulées) sur l'axe 0 h → 24 h, en 0..1. */
export function clockFraction(minutes: number): number {
  return ((((minutes % DAY) + DAY) % DAY)) / DAY
}

/**
 * Segments [début, fin] (fractions 0..1) couvrant la plage min→max sur l'axe 24 h.
 * Deux segments quand la plage franchit minuit (ex. coucher 23:00 → 00:30), un seul
 * sinon. Une plage ≥ 24 h couvre tout l'axe.
 */
export function rangeToSegments(min: number, max: number): Array<[number, number]> {
  if (max - min >= DAY) return [[0, 1]]
  const lo = clockFraction(min)
  const hi = clockFraction(max)
  if (lo <= hi) return [[lo, hi]]
  return [[0, hi], [lo, 1]] // franchit minuit → deux segments
}
