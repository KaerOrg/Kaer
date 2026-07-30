/**
 * Rampe de densité d'un comptage : une seule échelle, deux rendus.
 *
 * Conformité MDR 2017/745 : cette rampe code un NOMBRE DE SAISIES, jamais une
 * intensité, jamais une gravité clinique. Plus une case est dense, plus le patient a
 * employé ce mot ou vécu cette situation : c'est un effectif, pas un jugement. Aucune
 * teinte d'alarme n'entre donc dans la rampe, seulement l'opacité d'une même couleur.
 *
 * Les paliers sont volontairement grossiers : quatre niveaux se lisent d'un coup d'oeil,
 * là où un dégradé continu inviterait à comparer les cases une à une.
 */
function densityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

/** Suffixe alpha hexadécimal, quand la teinte de fond est un `#RRGGBB` de la config. */
const ALPHAS = ['00', '2E', '57', '80', 'A8'] as const
export function densityAlpha(count: number): string {
  return ALPHAS[densityLevel(count)]
}

/** Opacité, quand la teinte de fond vient d'un token CSS et non d'un hex. */
const OPACITIES = [0, 0.18, 0.34, 0.5, 0.66] as const
export function densityOpacity(count: number): number {
  return OPACITIES[densityLevel(count)]
}

/** Un comptage représentatif par palier, pour rendre la légende de la rampe. */
export const DENSITY_STEPS = [1, 2, 4, 7] as const
