// ─── Logique pure du compagnon de crise — aperçu web (lecture seule) ─────────
//
// Fonctions sans dépendance React — testables en isolation. Miroir du dialecte
// mobile (`layouts/CrisisCompanion/crisisLogic.ts`). Conformité MDR : aucune
// interprétation, uniquement de la mise en forme.

/** Durées par défaut (minutes) si la config est absente ou invalide. */
export const DEFAULT_DURATIONS: readonly number[] = [5, 15]

/**
 * Parse les durées issues des clés indexées `duration_1`, `duration_2`, …
 * (collectées via `collectIndexed`) en minutes positives.
 * Retourne {@link DEFAULT_DURATIONS} si rien d'exploitable.
 */
export function parseDurations(raw: readonly string[] | undefined): number[] {
  if (!raw || raw.length === 0) return [...DEFAULT_DURATIONS]
  const parsed = raw
    .map(part => Number.parseInt(part.trim(), 10))
    .filter(n => Number.isFinite(n) && n > 0)
  return parsed.length > 0 ? parsed : [...DEFAULT_DURATIONS]
}
