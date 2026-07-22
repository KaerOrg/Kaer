// Techniques de défusion du module « Décrocher d'une pensée » (cognitive_saturation).
// Source de vérité web, alignée sur `defusionService` mobile (parité web ≡ mobile).

export const DEFUSION_TECHNIQUES = ['word_repetition', 'linguistic_distancing'] as const

export type DefusionTechnique = (typeof DEFUSION_TECHNIQUES)[number]

/**
 * Techniques activées par le praticien, dérivées de `patient_modules.config`.
 * Défaut robuste = les deux techniques (config absente/vide/malformée ne masque
 * jamais le module). Ordre canonique préservé. Miroir de `enabledTechniquesFromConfig`
 * mobile.
 */
export function enabledTechniquesFromConfig(
  config: Record<string, unknown> | null | undefined,
): DefusionTechnique[] {
  const raw = config?.enabled_techniques
  if (!Array.isArray(raw)) return [...DEFUSION_TECHNIQUES]
  const enabled = DEFUSION_TECHNIQUES.filter((technique) => raw.includes(technique))
  return enabled.length > 0 ? enabled : [...DEFUSION_TECHNIQUES]
}
