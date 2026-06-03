import type { ChartProps } from './chartTypes'

const W = 220
const H = 48

/**
 * Mini-courbe SVG — segments interrompus sur les valeurs `null` (jours manquants),
 * marqueurs circulaires sur les points présents. Primitif pur, aucune logique métier.
 */
export function MiniLineChart({ data, color, maxY = 3 }: ChartProps) {
  const xScale = (i: number) => (i / (data.length - 1)) * W
  const yScale = (v: number) => H - (v / maxY) * H * 0.9 - 2

  const segments: string[][] = []
  let current: string[] = []
  data.forEach((v, i) => {
    if (v === null) {
      if (current.length >= 2) segments.push(current)
      current = []
    } else {
      current.push(`${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`)
    }
  })
  if (current.length >= 2) segments.push(current)

  const filled = data.map((v, i) => ({ v, i })).filter(d => d.v !== null) as { v: number; i: number }[]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
      {[1, 2, 3].map(v => (
        <line key={v} x1={0} y1={yScale(v)} x2={W} y2={yScale(v)} stroke="var(--color-border)" strokeWidth={1} />
      ))}
      {segments.map((pts, idx) => (
        <polyline
          key={idx}
          points={pts.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {filled.map(({ v, i }) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(v)}
          r={v === 0 ? 1.5 : 2.5}
          fill={v === 0 ? 'var(--color-border)' : color}
          stroke={v === 0 ? color : 'none'}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}
