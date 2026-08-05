/**
 * Durée à présélectionner dans la feuille de préparation.
 *
 * `preferred_duration_min` est une valeur libre en base, alors que la feuille ne
 * propose que les durées déclarées en config. Si la durée enregistrée n'y figure
 * pas (config modifiée depuis, valeur posée par le praticien), on retient la plus
 * proche plutôt que de laisser le contrôle sans segment actif : un segmenté vide
 * ne dit pas au patient quelle durée il s'apprête à faire.
 *
 * Retourne `null` quand aucune durée n'est proposée : l'appelant ne doit alors pas
 * rendre le contrôle.
 */
export function resolvePreferredDuration(
  preferredMin: number,
  durations: readonly number[],
): number | null {
  if (durations.length === 0) return null
  if (durations.includes(preferredMin)) return preferredMin
  return durations.reduce((closest, current) =>
    Math.abs(current - preferredMin) < Math.abs(closest - preferredMin) ? current : closest,
  )
}
