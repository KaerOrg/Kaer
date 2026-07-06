// Lecture de `patient_modules.config` (jsonb opaque) — helpers purs partagés
// web ≡ mobile. `enabled_groups` : groupes de colonnes optionnelles activés par
// le praticien pour ce patient (ex. 'evidence' sur beck_columns).

export function readEnabledGroups(config: Record<string, unknown> | null | undefined): string[] {
  const groups = config?.['enabled_groups']
  if (!Array.isArray(groups)) return []
  return groups.filter((g): g is string => typeof g === 'string')
}
