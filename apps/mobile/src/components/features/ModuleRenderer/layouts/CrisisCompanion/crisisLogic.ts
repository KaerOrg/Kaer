// ─── Logique pure du compagnon de crise (urge surfing) ──────────────────────
//
// Fonctions sans dépendance React ni i18n — testables en isolation.
// Conformité MDR 2017/745 : aucun calcul interprétatif, uniquement de la mise en
// forme (durées, compte à rebours, rotation d'activités).

/** Durées par défaut (minutes) si la config est absente ou invalide. */
export const DEFAULT_DURATIONS: readonly number[] = [5, 15]

/**
 * Parse la prop `durations` (ex. "5,15") en minutes positives.
 * Retourne {@link DEFAULT_DURATIONS} si rien d'exploitable.
 */
export function parseDurations(raw: string | undefined): number[] {
  if (!raw) return [...DEFAULT_DURATIONS]
  const parsed = raw
    .split(',')
    .map(part => Number.parseInt(part.trim(), 10))
    .filter(n => Number.isFinite(n) && n > 0)
  return parsed.length > 0 ? parsed : [...DEFAULT_DURATIONS]
}

/** Formate un nombre de secondes en `M:SS` (ex. 90 → "1:30"). */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Index de l'activité suivante dans une catégorie (rotation circulaire).
 * Retourne 0 si la liste est vide.
 */
export function nextActivityIndex(current: number, total: number): number {
  if (total <= 0) return 0
  return (current + 1) % total
}

/**
 * Fraction de temps écoulé (0 → 1) — sert à dessiner la barre de la « vague ».
 * Bornée à [0, 1] ; retourne 0 si la durée totale est nulle.
 */
export function elapsedFraction(remainingSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0
  const fraction = (totalSeconds - remainingSeconds) / totalSeconds
  return Math.min(1, Math.max(0, fraction))
}
