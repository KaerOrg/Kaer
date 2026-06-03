// Helpers purs + constantes géométriques partagés par les graphiques du layout
// générique « slider_dashboard » (CompositeChart, DimensionChart, MonthCalendar).
// Aucune donnée patient réelle : l'aperçu praticien est alimenté par un mock
// déterministe dérivé de l'identifiant de la dimension.

export type Tab = 'entry' | 'charts' | 'month'
export type TimeRange = '7J' | '1M' | '3M' | '1A'

export const RANGES: TimeRange[] = ['7J', '1M', '3M', '1A']

// Palette de repli si une dimension n'a pas de couleur en field_props.
export const FALLBACK_PALETTE = [
  '#8B5CF6', '#F59E0B', '#EF4444', '#059669', '#0EA5E9', '#10B981',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#A855F7', '#84CC16',
]

// ── Mock déterministe par dimension ──────────────────────────────────────────
export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function rangeLength(range: TimeRange): number {
  if (range === '7J') return 7
  if (range === '1M') return 30
  if (range === '3M') return 13
  return 12
}

export function getMockData(fieldId: string, range: TimeRange): number[] {
  const len = rangeLength(range)
  const seed = hashStr(fieldId)
  const base = 3 + (seed % 4)
  const amp = 1.5 + ((seed >> 3) % 3)
  const phase = seed % 7
  return Array.from({ length: len }, (_, i) => {
    const v = base + Math.sin((i + phase) / 2.2) * amp + (((i * 13 + seed) % 3) - 1) * 0.5
    return Math.max(0, Math.min(10, Math.round(v)))
  })
}

export function mockCurrent(fieldId: string): number {
  return getMockData(fieldId, '7J')[6]
}

// ── Repères temporels mock ───────────────────────────────────────────────────
export const RANGE_SPAN_DAYS: Record<TimeRange, number> = { '7J': 6, '1M': 29, '3M': 84, '1A': 334 }

export function markerFraction(daysAgo: number, range: TimeRange): number | null {
  const f = 1 - daysAgo / RANGE_SPAN_DAYS[range]
  return f >= 0 && f <= 1 ? f : null
}

export interface MockMarker { id: string; daysAgo: number; labelKey: string }
export interface DimSeries { id: string; color: string; label: string; values: number[] }

// ── Labels d'axe X ───────────────────────────────────────────────────────────
export interface XLabel { i: number; label: string }

export function buildXLabels(range: TimeRange): XLabel[] {
  const now = new Date()
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('fr-FR', o).replace(/\./g, '')
  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i))
      return { i, label: String(d.getDate()) }
    })
  }
  if (range === '1M') {
    return [0, 9, 19, 29].map(i => {
      const d = new Date(now); d.setDate(d.getDate() - (29 - i))
      return { i, label: fmt(d, { day: 'numeric', month: 'short' }) }
    })
  }
  if (range === '3M') {
    return [0, 5, 11].map(i => {
      const d = new Date(now); d.setDate(d.getDate() - (11 - i) * 7)
      return { i, label: fmt(d, { month: 'short' }).slice(0, 4) }
    })
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return { i, label: fmt(d, { month: 'short' }).slice(0, 3) }
  })
}

// ── Géométrie SVG ────────────────────────────────────────────────────────────
export const VB_W = 280
export const PAD_LEFT = 18
export const PAD_R = 8
export const Y_TICKS = [10, 5, 0]

export function lineFor(values: number[], plotTop: number, plotH: number): string {
  const n = values.length
  return values.map((v, i) => {
    const x = PAD_LEFT + (i / (n - 1)) * (VB_W - PAD_LEFT - PAD_R)
    const y = plotTop + plotH - (v / 10) * plotH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}
