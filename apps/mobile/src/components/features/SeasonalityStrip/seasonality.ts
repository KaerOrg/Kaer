import type { ScaleEntry } from '../../../lib/database'

// ─── Saisonnalité — moyennes mensuelles par année pour une dimension ─────────
//
// Superpose jusqu'à 5 années pour lire un rythme saisonnier (ex. bipolarité
// saisonnière). Chaque cellule = moyenne descriptive de la dimension sur le mois
// (résumé de la série brute, autorisé MDR ; jamais un seuil ni un jugement).
// Mois sans saisie → null (aucune valeur inventée).

export interface SeasonYearRow {
  readonly year: number
  /** 12 moyennes mensuelles (index 0 = janvier), null si aucune saisie ce mois. */
  readonly months: (number | null)[]
}

/**
 * @param entries       saisies brutes (toutes dates)
 * @param dimensionKey  dimension observée (ex. 'mood')
 * @param years         années à produire, dans l'ordre voulu (récent → ancien)
 */
export function buildSeasonality(
  entries: readonly ScaleEntry[],
  dimensionKey: string,
  years: readonly number[],
): SeasonYearRow[] {
  // Accumulateurs somme/compte par année → 12 mois.
  const sums = new Map<number, number[]>()
  const counts = new Map<number, number[]>()
  for (const y of years) {
    sums.set(y, new Array<number>(12).fill(0))
    counts.set(y, new Array<number>(12).fill(0))
  }

  for (const entry of entries) {
    const subs = entry.subscale_scores
    if (subs == null) continue
    const raw = subs[dimensionKey]
    if (typeof raw !== 'number') continue
    const d = new Date(entry.created_at)
    if (Number.isNaN(d.getTime())) continue
    const y = d.getFullYear()
    const yearSums = sums.get(y)
    const yearCounts = counts.get(y)
    if (yearSums == null || yearCounts == null) continue
    const m = d.getMonth()
    yearSums[m] += raw
    yearCounts[m] += 1
  }

  return years.map(year => {
    const yearSums = sums.get(year) ?? []
    const yearCounts = counts.get(year) ?? []
    const months = Array.from({ length: 12 }, (_, m) =>
      yearCounts[m] > 0 ? yearSums[m] / yearCounts[m] : null
    )
    return { year, months }
  })
}
