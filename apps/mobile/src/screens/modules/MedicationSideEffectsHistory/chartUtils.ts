import type { ScaleEntry } from '../../../lib/database'
import type { DataPoint, XLabel } from '../../../components/ui/Chart'
import type { TimeRange } from './types'

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

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const label = d
      .toLocaleDateString(locale, { month: 'short' })
      .replace(/\./g, '')
      .slice(0, 3)
    return { index: i, label }
  })
}

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

  if (range === '6M') {
    return Array.from({ length: 26 }, (_, i) => {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (25 - i) * 7)
      const bucketStart = new Date(bucketEnd)
      bucketStart.setDate(bucketStart.getDate() - 6)
      const bucket = entries.filter(e => {
        const d = new Date(e.created_at)
        return d >= bucketStart && d <= bucketEnd
      })
      if (bucket.length === 0) return { value: 0, hasValue: false }
      const avg = bucket.reduce((s, e) => s + ((e.subscale_scores?.[key] as number | undefined) ?? 0), 0) / bucket.length
      return { value: avg, hasValue: true }
    })
  }

  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const bucket = entries.filter(e => {
      const d = new Date(e.created_at)
      return d >= month && d <= monthEnd
    })
    if (bucket.length === 0) return { value: 0, hasValue: false }
    const avg = bucket.reduce((s, e) => s + ((e.subscale_scores?.[key] as number | undefined) ?? 0), 0) / bucket.length
    return { value: avg, hasValue: true }
  })
}

export function computeAvg(points: DataPoint[]): string {
  const valid = points.filter(p => p.hasValue)
  if (valid.length === 0) return '—'
  const avg = valid.reduce((s, p) => s + p.value, 0) / valid.length
  return avg.toFixed(1)
}

export function computeStreak(entries: ScaleEntry[]): number {
  if (entries.length === 0) return 0
  const datesWithEntry = new Set(entries.map(e => e.created_at.slice(0, 10)))
  let streak = 0
  const cur = new Date()
  cur.setHours(0, 0, 0, 0)
  while (true) {
    const dateStr = cur.toISOString().slice(0, 10)
    if (!datesWithEntry.has(dateStr)) break
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}
