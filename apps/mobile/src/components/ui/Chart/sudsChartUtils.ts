// Helpers partagés entre les chart SUDs (line chart full + sparkline).
// Maths pures, sans dépendance React.

export interface SudsPoint {
  /** Score SUDs (0-100). */
  readonly score: number
  /** Date ISO 8601 de la séance. Optionnel pour les sparklines. */
  readonly date?: string
}

export interface ChartPadding {
  readonly top: number
  readonly bottom: number
  readonly left: number
  readonly right: number
}

export function sudsToY(score: number, height: number, padding: ChartPadding): number {
  const plotH = height - padding.top - padding.bottom
  return padding.top + (1 - score / 100) * plotH
}

export function pointToX(
  index: number,
  total: number,
  width: number,
  padding: ChartPadding
): number {
  const plotW = width - padding.left - padding.right
  if (total <= 1) return padding.left + plotW / 2
  return padding.left + (index / (total - 1)) * plotW
}

interface XYPoint {
  readonly x: number
  readonly y: number
}

export function smoothPath(points: readonly XYPoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpX = (prev.x + curr.x) / 2
    d += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

export function areaPath(points: readonly XYPoint[], bottomY: number): string {
  if (points.length === 0) return ''
  const linePart = smoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${linePart} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
}
