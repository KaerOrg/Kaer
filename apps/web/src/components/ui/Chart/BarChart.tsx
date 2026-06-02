import type { ChartProps } from './chartTypes'

const MAX_H = 48

/**
 * Mini-graphique en barres verticales — barres absentes (`null`) rendues comme
 * trait grisé minimal. Primitif pur, aucune logique métier.
 */
export function BarChart({ data, color, maxY = 3 }: ChartProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: MAX_H }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
        >
          <div style={{
            height: v !== null ? `${Math.max((v / maxY) * 100, v > 0 ? 10 : 4)}%` : '4%',
            background: v !== null && v > 0 ? color : 'var(--color-border)',
            borderRadius: '3px 3px 1px 1px',
            opacity: v === null ? 0.2 : 1,
          }} />
        </div>
      ))}
    </div>
  )
}
