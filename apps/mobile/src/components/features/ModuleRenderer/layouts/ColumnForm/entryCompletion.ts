import { isFilledValue } from '@kaer/shared'

// Statut de complétion d'une fiche `column_form` — DÉRIVÉ des valeurs, jamais
// stocké : une fiche reste « à compléter » tant que les clés `complete_key_*`
// de la config ne sont pas toutes renseignées.
// Statut de workflow (non clinique) — aucune interprétation (MDR 2017/745).

export function isEntryComplete(
  values: Record<string, unknown>,
  completeKeys: readonly string[],
): boolean {
  if (completeKeys.length === 0) return true
  return completeKeys.every(key => isFilledValue(values[key]))
}
