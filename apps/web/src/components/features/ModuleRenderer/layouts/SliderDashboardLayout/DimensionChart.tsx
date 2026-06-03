import {
  buildXLabels, lineFor, PAD_LEFT, PAD_R, VB_W, type TimeRange,
} from './chartGeom'

interface Props {
  color: string
  label: string
  values: number[]
  range: TimeRange
  moduleId: string
  t: (key: string) => string
}

// Graphique d'une seule dimension : barres sur 7 jours, courbe au-delà. Affiche
// uniquement des chiffres bruts mock — aucune moyenne interprétée, aucun seuil.
export function DimensionChart({ color, label, values, range, moduleId, t }: Props) {
  const plotTop = 6, plotBottom = 52, plotH = plotBottom - plotTop
  const labelY = 64, totalH = 66
  const n = values.length
  const xLabels = buildXLabels(range)
  const avg = (values.reduce((s, v) => s + v, 0) / (values.length || 1)).toFixed(1)
  const isBar = range === '7J'
  const innerW = VB_W - PAD_LEFT - PAD_R
  const yAt = (v: number) => plotTop + plotH - (v / 10) * plotH

  return (
    <div className="mt-chart-card">
      <div className="mt-chart-card__header">
        <span className="mt-chart-card__title mt-chart-card__title--dim">{label}</span>
        <span className="mt-chart-card__avg" style={{ color }}>
          {t(`modules.${moduleId}.chart_avg`).replace('{{value}}', avg)}
        </span>
      </div>
      <svg viewBox={`0 0 ${VB_W} ${totalH}`} className="mt-svg" preserveAspectRatio="xMidYMid meet">
        {[10, 5].map(v => (
          <g key={v}>
            <line x1={PAD_LEFT} y1={yAt(v)} x2={VB_W - PAD_R} y2={yAt(v)} stroke="#F1F5F9" strokeWidth={1} />
            <text x={PAD_LEFT - 4} y={yAt(v) + 3} textAnchor="end" fontSize={6} fill="#CBD5E1">{v}</text>
          </g>
        ))}
        {isBar ? (
          values.map((v, i) => {
            const bw = innerW / n * 0.6
            const x = PAD_LEFT + (i + 0.5) / n * innerW
            const h = (v / 10) * plotH
            return (
              <g key={i}>
                <text x={x} y={yAt(v) - 3} textAnchor="middle" fontSize={7} fontWeight="bold" fill={color}>{v}</text>
                <rect x={x - bw / 2} y={plotBottom - h} width={bw} height={h} rx={2} fill={color} opacity={0.9} />
              </g>
            )
          })
        ) : (
          <>
            <polyline points={lineFor(values, plotTop, plotH)} fill="none" stroke={color}
              strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {values.map((v, i) => {
              const x = PAD_LEFT + (i / (n - 1)) * innerW
              return <circle key={i} cx={x} cy={yAt(v)} r={n <= 12 ? 2.5 : 1.8} fill={color} stroke="#fff" strokeWidth={1} />
            })}
          </>
        )}
        {xLabels.map(({ i, label: lab }) => {
          const x = isBar
            ? PAD_LEFT + (i + 0.5) / n * innerW
            : PAD_LEFT + (i / (n - 1)) * innerW
          return <text key={i} x={x} y={labelY} textAnchor="middle" fontSize={6} fill="#9CA3AF">{lab}</text>
        })}
      </svg>
    </div>
  )
}
