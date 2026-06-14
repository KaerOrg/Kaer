// ─── Logique pure du compagnon de crise — aperçu web (lecture seule) ─────────
//
// Fonctions sans dépendance React — testables en isolation. Miroir du dialecte
// mobile (`layouts/CrisisCompanion/crisisLogic.ts`). Conformité MDR : aucune
// interprétation, uniquement de la mise en forme.

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
