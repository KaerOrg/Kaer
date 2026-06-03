// Fonctions pures de construction de données pour les graphiques temporels.
// Utilisées par MoodTrackerScreen et MedicationSideEffectsHistoryScreen.

import type { ScaleEntry } from '../../../../lib/database'

export type TimeRange = '7J' | '1M' | '3M' | '6M' | '1A'

export interface DataPoint {
  value: number
  hasValue: boolean
}

export interface XLabel {
  index: number
  label: string
}

// ── X-axis labels ─────────────────────────────────────────────────────────────

export function buildXLabels(range: TimeRange, locale: string): XLabel[] {
  const now = new Date()

  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      return { index: i, label: String(d.getDate()) }
    })
  }

  if (range === '1M') {
    return [0, 9, 19, 29].map(i => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const label = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
        .replace(/\./g, '').replace(/\s+/g, ' ')
      return { index: i, label }
    })
  }

  if (range === '3M') {
    const labels: XLabel[] = []
    let lastMonth = -1
    for (let i = 0; i < 13; i++) {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (12 - i) * 7)
      const month = bucketEnd.getMonth()
      if (month !== lastMonth) {
        lastMonth = month
        const label = bucketEnd
          .toLocaleDateString(locale, { month: 'short' })
          .replace(/\./g, '')
          .slice(0, 4)
        labels.push({ index: i, label })
      }
    }
    return labels
  }

  if (range === '6M') {
    const labels: XLabel[] = []
    let lastMonth = -1
    for (let i = 0; i < 26; i++) {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (25 - i) * 7)
      const month = bucketEnd.getMonth()
      if (month !== lastMonth) {
        lastMonth = month
        const label = bucketEnd
          .toLocaleDateString(locale, { month: 'short' })
          .replace(/\./g, '')
          .slice(0, 4)
        labels.push({ index: i, label })
      }
    }
    return labels
  }

  // 1A — one label per month
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const label = d
      .toLocaleDateString(locale, { month: 'short' })
      .replace(/\./g, '')
      .slice(0, 3)
    return { index: i, label }
  })
}

// ── Chart data builders ───────────────────────────────────────────────────────

export function buildChartData(entries: ScaleEntry[], key: string, range: TimeRange): DataPoint[] {
  const now = new Date()

  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const entry = entries.find(e => e.created_at.slice(0, 10) === dateStr)
      const val = entry?.subscale_scores?.[key] as number | undefined
      return { value: val ?? 0, hasValue: val != null }
    })
  }

  if (range === '1M') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const entry = entries.find(e => e.created_at.slice(0, 10) === dateStr)
      const val = entry?.subscale_scores?.[key] as number | undefined
      return { value: val ?? 0, hasValue: val != null }
    })
  }

  const weeklyBuckets = (n: number) =>
    Array.from({ length: n }, (_, i) => {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (n - 1 - i) * 7)
      const bucketStart = new Date(bucketEnd)
      bucketStart.setDate(bucketStart.getDate() - 6)
      const bucket = entries.filter(e => {
        const d = new Date(e.created_at)
        return d >= bucketStart && d <= bucketEnd
      })
      if (bucket.length === 0) return { value: 0, hasValue: false }
      const avg =
        bucket.reduce((s, e) => s + ((e.subscale_scores?.[key] as number | undefined) ?? 0), 0) /
        bucket.length
      return { value: avg, hasValue: true }
    })

  if (range === '3M') return weeklyBuckets(13)
  if (range === '6M') return weeklyBuckets(26)

  // 1A — monthly buckets
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const bucket = entries.filter(e => {
      const d = new Date(e.created_at)
      return d >= month && d <= monthEnd
    })
    if (bucket.length === 0) return { value: 0, hasValue: false }
    const avg =
      bucket.reduce((s, e) => s + ((e.subscale_scores?.[key] as number | undefined) ?? 0), 0) /
      bucket.length
    return { value: avg, hasValue: true }
  })
}

// ── Total score chart data (pour ScaleHistoryScreen) ─────────────────────────

export function buildTotalScoreChartData(entries: ScaleEntry[], range: TimeRange): DataPoint[] {
  const now = new Date()

  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const entry = entries.find(e => e.created_at.slice(0, 10) === dateStr)
      return { value: entry?.total_score ?? 0, hasValue: entry != null }
    })
  }

  if (range === '1M') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const entry = entries.find(e => e.created_at.slice(0, 10) === dateStr)
      return { value: entry?.total_score ?? 0, hasValue: entry != null }
    })
  }

  const weeklyBuckets = (n: number) =>
    Array.from({ length: n }, (_, i) => {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (n - 1 - i) * 7)
      const bucketStart = new Date(bucketEnd)
      bucketStart.setDate(bucketStart.getDate() - 6)
      const bucket = entries.filter(e => {
        const d = new Date(e.created_at)
        return d >= bucketStart && d <= bucketEnd
      })
      if (bucket.length === 0) return { value: 0, hasValue: false }
      const avg = bucket.reduce((s, e) => s + e.total_score, 0) / bucket.length
      return { value: avg, hasValue: true }
    })

  if (range === '3M') return weeklyBuckets(13)
  if (range === '6M') return weeklyBuckets(26)

  // 1A — monthly buckets
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const bucket = entries.filter(e => {
      const d = new Date(e.created_at)
      return d >= month && d <= monthEnd
    })
    if (bucket.length === 0) return { value: 0, hasValue: false }
    const avg = bucket.reduce((s, e) => s + e.total_score, 0) / bucket.length
    return { value: avg, hasValue: true }
  })
}

// ── Aggregates ────────────────────────────────────────────────────────────────

export function computeAvg(points: DataPoint[]): string {
  const valid = points.filter(p => p.hasValue)
  if (valid.length === 0) return '—'
  return (valid.reduce((s, p) => s + p.value, 0) / valid.length).toFixed(1)
}

export function computeStreak(entries: ScaleEntry[]): number {
  if (entries.length === 0) return 0
  const datesWithEntry = new Set(entries.map(e => e.created_at.slice(0, 10)))
  let streak = 0
  const cur = new Date()
  cur.setUTCHours(0, 0, 0, 0)
  while (true) {
    const dateStr = cur.toISOString().slice(0, 10)
    if (!datesWithEntry.has(dateStr)) break
    streak++
    cur.setUTCDate(cur.getUTCDate() - 1)
  }
  return streak
}

// ── Composite (mean across all keys per slot) ─────────────────────────────────

export function buildCompositeData(
  entries: ScaleEntry[],
  keys: readonly string[],
  range: TimeRange,
): DataPoint[] {
  const perKey = keys.map(k => buildChartData(entries, k, range))
  const n = perKey[0]?.length ?? 0
  return Array.from({ length: n }, (_, i) => {
    const valids = perKey.map(kd => kd[i]).filter(p => p.hasValue)
    if (valids.length === 0) return { value: 0, hasValue: false }
    return {
      value: valids.reduce((s, p) => s + p.value, 0) / valids.length,
      hasValue: true,
    }
  })
}

// ── Repères temporels (Life Chart) ────────────────────────────────────────────

// Étendue de la fenêtre en jours pour chaque plage (du 1er point jusqu'à aujourd'hui).
const RANGE_SPAN_DAYS: Record<TimeRange, number> = {
  '7J': 6,
  '1M': 29,
  '3M': 84,     // 12 buckets × 7 j
  '6M': 175,    // 25 buckets × 7 j
  '1A': 334.84, // 11 buckets × 30.44 j
}

/**
 * Position horizontale (0 = bord gauche du graphe, 1 = aujourd'hui) d'une date
 * dans la plage courante. Retourne null si la date est hors de la fenêtre.
 *
 * Calcul en UTC pour rester aligné avec buildChartData (qui indexe les points
 * via `created_at.slice(0,10)`, donc sur des dates UTC).
 */
export function markerXFraction(dateStr: string, range: TimeRange): number | null {
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const dUTC = Date.UTC(parts[0], parts[1] - 1, parts[2])
  const now = new Date()
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const daysAgo = Math.round((nowUTC - dUTC) / 86_400_000)
  const span = RANGE_SPAN_DAYS[range]
  const fraction = 1 - daysAgo / span
  if (fraction < 0 || fraction > 1) return null
  return fraction
}
