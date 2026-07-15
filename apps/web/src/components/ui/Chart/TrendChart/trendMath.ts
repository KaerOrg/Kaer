// Helpers purs du graphe de tendance précis (TrendChart) — sans JSX, testables.
// Valeurs brutes : moyenne arithmétique, dernier point renseigné, fusion des séries.

export interface TrendPoint {
  /** Date ISO (YYYY-MM-DD) portée par l'axe X. */
  date: string
  /** Valeur de la nuit ; `null` = nuit non renseignée (interruption de la courbe). */
  value: number | null
  /** Marqueur d'événement sur l'axe (ex. cauchemar). */
  event?: boolean
}

/** Moyenne brute des valeurs renseignées, arrondie à 1 décimale. `null` si aucune. */
export function computeTrendMean(data: TrendPoint[]): number | null {
  const values = data.map(d => d.value).filter((v): v is number => v != null)
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

/** Dernier point renseigné (mise en avant de la valeur récente). `null` si aucun. */
export function lastFilledPoint(data: TrendPoint[]): { date: string; value: number } | null {
  for (let i = data.length - 1; i >= 0; i -= 1) {
    const v = data[i].value
    if (v != null) return { date: data[i].date, value: v }
  }
  return null
}

/** Dates des nuits portant un événement (cauchemar) — pour les marqueurs d'axe. */
export function eventDates(data: TrendPoint[]): string[] {
  return data.filter(d => d.event).map(d => d.date)
}

/** Valeur formatée avec son unité (« 85 % », « 27 min », « 7.5 h », « 3.8 /5 »). */
export function formatTrendValue(value: number, unit: string): string {
  return unit ? `${value} ${unit}` : String(value)
}

export interface MergedTrendRow {
  date: string
  value: number | null
  ref?: number | null
}

/**
 * Fusionne la série principale et une éventuelle série de comparaison sur l'axe des
 * dates (union des dates, triée). Alimente Recharts qui attend un tableau unique.
 */
export function mergeTrendSeries(main: TrendPoint[], comparison?: TrendPoint[]): MergedTrendRow[] {
  const byDate = new Map<string, MergedTrendRow>()
  for (const p of main) byDate.set(p.date, { date: p.date, value: p.value })
  if (comparison) {
    for (const p of comparison) {
      const row = byDate.get(p.date)
      if (row) row.ref = p.value
      else byDate.set(p.date, { date: p.date, value: null, ref: p.value })
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}
