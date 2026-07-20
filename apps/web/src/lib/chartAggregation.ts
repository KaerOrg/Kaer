// ─── Agrégation par cadence + politique des trous (page Évolution, #159) ─────
//
// Les patients oublient des saisies : c'est le comportement attendu. Pour une
// courbe longue durée lisible, on agrège les points bruts datés à la CADENCE du
// module (hebdomadaire / mensuelle) : 1 point par unité, moyenne des saisies de
// l'unité, en conservant `n` (nombre de saisies, transparence de fiabilité) et en
// émettant `null` pour une unité vide (nécessaire à la logique de trous).
//
// Politique des trous (MDR : ne jamais tracer une ligne plate trompeuse) :
//   - 1 unité vide  → « pont » pointillé (continuité préservée, trou visible) ;
//   - 2 unités vides consécutives ou + → coupure + bande « aucune saisie ».
//
// Logique pure, sans JSX, testée isolément. Ancrage LOCAL des dates (jamais UTC)
// pour éviter tout décalage de jour en fuseau positif.

export type Cadence = 'weekly' | 'monthly'

export interface RawDatedPoint {
  /** Date ISO (jour ou horodatage) de la saisie. */
  readonly date: string
  /** Valeur brute, ou null (saisie sans cette mesure). */
  readonly value: number | null
}

export interface AggregatedPoint {
  /** Date ISO (YYYY-MM-DD) représentative de l'unité (début d'unité, local). */
  readonly date: string
  /** Moyenne des valeurs renseignées de l'unité ; null si aucune saisie. */
  readonly value: number | null
  /** Nombre de saisies derrière ce point (0 si unité vide). */
  readonly n: number
}

const DAY_MS = 86_400_000

const toIsoLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Début d'unité (local) : lundi de la semaine, ou 1er du mois. */
function unitStart(d: Date, cadence: Cadence): Date {
  if (cadence === 'monthly') return new Date(d.getFullYear(), d.getMonth(), 1)
  const day = d.getDay() // 0=dim..6=sam
  const deltaToMonday = (day + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - deltaToMonday)
}

/** Unité suivante (local). */
function nextUnit(d: Date, cadence: Cadence): Date {
  return cadence === 'monthly'
    ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
    : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
}

/**
 * Agrège des points bruts datés en une série continue d'unités de cadence, de
 * (now - rangeDays) à now. Chaque unité porte la moyenne de ses saisies + `n` ;
 * une unité sans saisie porte `value: null, n: 0`.
 */
export function aggregateByCadence(
  points: readonly RawDatedPoint[],
  cadence: Cadence,
  rangeDays: number,
  now: number = Date.now(),
): AggregatedPoint[] {
  // Accumulateurs par clé d'unité.
  const sums = new Map<string, number>()
  const counts = new Map<string, number>()
  for (const p of points) {
    const d = new Date(p.date)
    if (Number.isNaN(d.getTime())) continue
    if (d.getTime() < now - rangeDays * DAY_MS || d.getTime() > now) continue
    const key = toIsoLocal(unitStart(d, cadence))
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (typeof p.value === 'number') sums.set(key, (sums.get(key) ?? 0) + p.value)
  }

  // Série continue d'unités (début → fin), pour que les trous apparaissent.
  const start = unitStart(new Date(now - rangeDays * DAY_MS), cadence)
  const end = unitStart(new Date(now), cadence)
  const out: AggregatedPoint[] = []
  for (let cur = start; cur.getTime() <= end.getTime(); cur = nextUnit(cur, cadence)) {
    const key = toIsoLocal(cur)
    const n = counts.get(key) ?? 0
    const sum = sums.get(key)
    const value = n > 0 && sum != null ? Math.round((sum / n) * 10) / 10 : null
    out.push({ date: key, value, n })
  }
  return out
}

/**
 * Pont engine → `TrendChart` : agrège les saisies brutes à la cadence puis calcule
 * les segments de trous. `data` est directement une série `TrendPoint[]` (les
 * `AggregatedPoint` en sont un sur-ensemble structurel), `gaps` alimente la prop
 * `gaps` du graphe. C'est la forme « courbe lissée à la cadence » de #159.
 */
export function buildCadenceTrend(
  points: readonly RawDatedPoint[],
  cadence: Cadence,
  rangeDays: number,
  now: number = Date.now(),
): { data: AggregatedPoint[]; gaps: GapSegments } {
  const data = aggregateByCadence(points, cadence, rangeDays, now)
  return { data, gaps: computeGapSegments(data) }
}

/**
 * Nombre de jours entre la plus ancienne saisie et `now` (+ marge). Fenêtre
 * couvrant tout l'historique, pour les vues SANS sélecteur de période (modale
 * « Données ») : `aggregateByCadence` écarte les points hors `rangeDays`, donc on
 * lui passe la portée réelle des données. Durée (pas une date métier) → le calcul
 * en millisecondes est sans risque de fuseau. Repli à 30 j si aucune saisie.
 */
export function spanDays(points: readonly { readonly date: string }[], now: number = Date.now()): number {
  let oldest = Infinity
  for (const p of points) {
    const t = new Date(p.date).getTime()
    if (!Number.isNaN(t) && t < oldest) oldest = t
  }
  if (!Number.isFinite(oldest)) return 30
  return Math.max(30, Math.ceil((now - oldest) / DAY_MS) + 2)
}

export interface GapSegments {
  /** Trous d'UNE unité, à ponter en pointillé (dates des deux points encadrants). */
  readonly bridges: { readonly from: string; readonly to: string }[]
  /** Trous de 2 unités ou +, en bande « aucune saisie » (dates début/fin des vides). */
  readonly bands: { readonly from: string; readonly to: string }[]
}

/**
 * Détecte, dans une série agrégée, les trous ENTRE deux points renseignés :
 * un trou d'1 unité → pont ; un trou de 2 unités ou + → bande. Les vides de tête
 * et de queue (avant la 1re / après la dernière saisie) ne comptent pas.
 */
export function computeGapSegments(series: readonly AggregatedPoint[]): GapSegments {
  const bridges: { from: string; to: string }[] = []
  const bands: { from: string; to: string }[] = []
  const filledIdx = series
    .map((p, i) => ({ p, i }))
    .filter(x => x.p.value != null)
  if (filledIdx.length < 2) return { bridges, bands }

  for (let k = 0; k < filledIdx.length - 1; k++) {
    const a = filledIdx[k]
    const b = filledIdx[k + 1]
    const gap = b.i - a.i - 1 // nombre d'unités vides entre deux points renseignés
    if (gap === 1) {
      bridges.push({ from: a.p.date, to: b.p.date })
    } else if (gap >= 2) {
      bands.push({ from: series[a.i + 1].date, to: series[b.i - 1].date })
    }
  }
  return { bridges, bands }
}
