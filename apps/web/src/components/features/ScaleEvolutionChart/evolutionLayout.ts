/**
 * Mise en coordonnées de la vue Évolution d'une échelle (#420, QW-3).
 *
 * **Pure, et testée à part du rendu.** C'est la seule partie qui peut se tromper
 * silencieusement : la revue de maquette avait trouvé des bandes dessinées dans un
 * espace de coordonnées INDÉPENDANT de la courbe, si bien que la valeur du 28 juillet
 * s'affichait sous le point du 14. Un écran parfaitement crédible, entièrement faux, et
 * invisible tant qu'on ne teste pas avec des intervalles irréguliers.
 *
 * Le remède est structurel : **une seule abscisse par passation**, calculée ici, que la
 * courbe ET les bandes consomment telle quelle. Il n'existe pas deux espaces à
 * synchroniser, donc rien à désynchroniser.
 */

/** Une passation, réduite à ce que la vue Évolution en montre. */
export interface EvolutionEntry {
  readonly id: string
  /** Instant de la passation (ISO). L'axe est proportionnel au TEMPS, pas au rang. */
  readonly date: string
  /** Total, ou `null` s'il n'a pas pu être lu. */
  readonly score: number | null
  /**
   * Modalités des items suivis en bande, dans l'ordre des bandes. `null` = item non
   * posé lors de cette passation (antérieure à son arrivée) : la cellule reste vide et
   * ne décale aucune colonne, puisque chaque colonne est positionnée en absolu.
   */
  readonly bandCodes: readonly (string | null)[]
}

export interface PlottedEntry extends EvolutionEntry {
  /** Abscisse, en pourcentage de la largeur utile du tracé. */
  readonly xPct: number
  /** Ordonnée, en pourcentage de la hauteur utile (0 = haut). `null` si aucun total. */
  readonly yPct: number | null
}

export interface GridLine {
  readonly value: number
  readonly yPct: number
}

export interface EvolutionLayout {
  readonly entries: readonly PlottedEntry[]
  /** Graduations horizontales, du bas vers le haut. */
  readonly gridLines: readonly GridLine[]
  /**
   * Tronçons de la polyline, en unités du `viewBox` (0 à 100 sur les deux axes). Un
   * total manquant interrompt le tracé plutôt que de le faire passer par zéro. Une
   * seule passation ne produit AUCUN tronçon : un point isolé n'est pas une courbe.
   */
  readonly segments: readonly string[]
}

/** Pas de la grille horizontale, en points de score. */
export const GRID_STEP = 5

const MS_PER_DAY = 86_400_000

function timeOf(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

/**
 * Projette les passations dans un repère en pourcentages.
 *
 * L'axe des x est **régulier en temps** : deux passations à 14 jours d'intervalle
 * occupent le même espace horizontal partout dans le graphe. Indexer par rang
 * égaliserait des intervalles inégaux, et les pentes ne seraient plus comparables
 * d'un segment à l'autre.
 *
 * @param yMax borne haute de l'axe vertical, dérivée de la configuration de l'échelle.
 */
export function buildEvolutionLayout(
  entries: readonly EvolutionEntry[],
  yMax: number,
): EvolutionLayout {
  const sorted = [...entries].sort((a, b) => timeOf(a.date) - timeOf(b.date))
  const times = sorted.map(e => timeOf(e.date))
  const tMin = times.length > 0 ? times[0] : 0
  const tMax = times.length > 0 ? times[times.length - 1] : 0
  const span = tMax - tMin
  const safeMax = yMax > 0 ? yMax : 1

  const plotted: PlottedEntry[] = sorted.map((entry, i) => ({
    ...entry,
    // Une passation unique, ou plusieurs au même instant : tout est centré plutôt que
    // collé au bord. Le rendu n'affiche de toute façon pas de courbe dans ce cas.
    xPct: span === 0 ? 50 : ((times[i] - tMin) / span) * 100,
    yPct: entry.score == null
      ? null
      : (1 - Math.max(0, Math.min(entry.score, safeMax)) / safeMax) * 100,
  }))

  const gridLines: GridLine[] = []
  for (let value = 0; value <= safeMax; value += GRID_STEP) {
    gridLines.push({ value, yPct: (1 - value / safeMax) * 100 })
  }

  return { entries: plotted, gridLines, segments: buildSegments(plotted) }
}

/** Découpe le tracé en tronçons continus : un total manquant l'interrompt. */
function buildSegments(entries: readonly PlottedEntry[]): string[] {
  const segments: string[] = []
  let current: string[] = []
  for (const entry of entries) {
    if (entry.yPct == null) {
      if (current.length >= 2) segments.push(current.join(' '))
      current = []
      continue
    }
    current.push(`${entry.xPct.toFixed(2)},${entry.yPct.toFixed(2)}`)
  }
  if (current.length >= 2) segments.push(current.join(' '))
  return segments
}

/** Fenêtres de lecture proposées. `all` = tout l'historique. */
export type EvolutionWindow = '6m' | '1y' | 'all'

export const EVOLUTION_WINDOWS: readonly EvolutionWindow[] = ['6m', '1y', 'all']

const WINDOW_DAYS: Record<Exclude<EvolutionWindow, 'all'>, number> = { '6m': 180, '1y': 365 }

/**
 * Restreint les passations à une fenêtre, en comptant depuis **la plus récente** et non
 * depuis aujourd'hui : un suivi interrompu il y a trois mois doit rester lisible, sinon
 * la fenêtre « 6 mois » viderait l'écran d'un patient qui a arrêté.
 */
export function filterByWindow<T extends { readonly date: string }>(
  entries: readonly T[],
  window: EvolutionWindow,
): readonly T[] {
  if (window === 'all' || entries.length === 0) return entries
  const latest = Math.max(...entries.map(e => timeOf(e.date)))
  const floor = latest - WINDOW_DAYS[window] * MS_PER_DAY
  return entries.filter(e => timeOf(e.date) >= floor)
}
