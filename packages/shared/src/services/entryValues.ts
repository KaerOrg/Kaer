// Prédicat partagé web ≡ mobile : une valeur de `payload.values` (jsonb opaque)
// est-elle « renseignée » ? Un nombre l'est toujours ; une chaîne l'est si elle
// n'est pas vide après trim. Règle unique (statut de complétion mobile ET rendu
// des fiches praticien) — pas d'interprétation clinique, simple présence (MDR).
export function isFilledValue(value: unknown): boolean {
  return typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0)
}
