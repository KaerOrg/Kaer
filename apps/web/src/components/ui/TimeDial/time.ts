/**
 * Helpers purs du cadran horaire (`TimeDial`) : conversions heure ⇄ minutes depuis
 * minuit et géométrie du repère sur l'anneau 24 h. Aucune dépendance React/DOM afin
 * d'être testables directement.
 */

export const MINUTES_PER_DAY = 1440

/** Borne un entier dans `[min, max]` (valeurs non entières tronquées vers 0). */
export function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

/** Minutes depuis minuit → `{ hours, minutes }` (bornées 0–23 / 0–59). */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  const m = ((Math.trunc(total) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return { hours: Math.floor(m / 60), minutes: m % 60 }
}

/** `{ hours, minutes }` → minutes depuis minuit (chaque part bornée avant somme). */
export function joinMinutes(hours: number, minutes: number): number {
  return clampInt(hours, 0, 23) * 60 + clampInt(minutes, 0, 59)
}

/** Minutes depuis minuit → chaîne « HH:MM » (deux chiffres). */
export function minutesToHHMM(total: number): string {
  const { hours, minutes } = splitMinutes(total)
  return `${pad2(hours)}:${pad2(minutes)}`
}

/** Chaîne « HH:MM » → minutes depuis minuit (parties invalides ramenées à 0). */
export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':')
  return joinMinutes(Number(h) || 0, Number(m) || 0)
}

/** Complète un nombre à deux chiffres (« 9 » → « 09 »). */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Position du pointeur (relative au centre du cadran) → minutes depuis minuit,
 * calées sur `step`. 0 h est en haut, le sens est horaire.
 * @param dx  x pointeur - x centre
 * @param dy  y pointeur - y centre
 * @param step pas d'aimantation en minutes (ex. 15)
 */
export function pointerToMinutes(dx: number, dy: number, step: number): number {
  // atan2(dx, -dy) : angle horaire mesuré depuis le haut, dans (-π, π].
  let angle = Math.atan2(dx, -dy)
  if (angle < 0) angle += 2 * Math.PI
  const fraction = angle / (2 * Math.PI)
  const raw = fraction * MINUTES_PER_DAY
  const snapped = Math.round(raw / step) * step
  return ((snapped % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

/** Fraction de tour [0, 1) correspondant à l'heure (pour l'arc `conic-gradient`). */
export function minutesToTurn(total: number): number {
  const m = ((Math.trunc(total) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return m / MINUTES_PER_DAY
}

/**
 * Coordonnées `{ x, y }` du repère pour l'heure donnée, sur un cercle d'orbite
 * `orbitRadius` centré en `(center, center)`. 0 h en haut, sens horaire.
 * `orbitRadius` est distinct du centre pour poser le repère sur la **bande** de
 * l'anneau (rayon d'orbite < rayon extérieur), pas sur son bord extérieur.
 */
export function markerPosition(
  total: number,
  center: number,
  orbitRadius: number,
): { x: number; y: number } {
  const theta = minutesToTurn(total) * 2 * Math.PI
  return {
    x: center + orbitRadius * Math.sin(theta),
    y: center - orbitRadius * Math.cos(theta),
  }
}
