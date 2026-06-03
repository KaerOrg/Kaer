import {
  buildXLabels, lineFor, markerFraction,
  PAD_LEFT, PAD_R, VB_W, Y_TICKS,
  type DimSeries, type MockMarker, type TimeRange,
} from './chartGeom'

interface Props {
  series: DimSeries[]
  range: TimeRange
  markers: MockMarker[]
  moduleId: string
  t: (key: string) => string
}

// Graphique composite (aperçu praticien) : une courbe fine par dimension + la
// moyenne en surimpression, avec repères temporels datés. Données mock — aucune
// interprétation clinique, aucun seuil (conformité MDR 2017/745).
export function CompositeChart({ series, range, markers, moduleId, t }: Props) {
  const plotTop = 6, plotBottom = 84, plotH = plotBottom - plotTop
  const labelY = 96
  const totalH = 100
  const n = series[0]?.values.length ?? 0
  const xLabels = buildXLabels(range)

  const avg = Array.from({ length: n }, (_, i) =>
    series.reduce((s, d) => s + d.values[i], 0) / series.length)
  const avgMean = (avg.reduce((s, v) => s + v, 0) / (avg.length || 1)).toFixed(1)

  const yAt = (v: number) => plotTop + plotH - (v / 10) * plotH
  const xFrac = (f: number) => PAD_LEFT + f * (VB_W - PAD_LEFT - PAD_R)

  const visibleMarkers = markers
    .map(m => ({ ...m, fraction: markerFraction(m.daysAgo, range) }))
    .filter((m): m is typeof m & { fraction: number } => m.fraction !== null)
    .sort((a, b) => a.fraction - b.fraction)
    .map((m, idx) => ({ ...m, index: idx + 1 }))

  return (
    <div className="mt-chart-card">
      <div className="mt-chart-card__header">
        <span className="mt-chart-card__title">{t(`modules.${moduleId}.chart_composite`)}</span>
        <span className="mt-chart-card__avg">
          {t(`modules.${moduleId}.chart_avg`).replace('{{value}}', avgMean)}
        </span>
      </div>
      <svg viewBox={`0 0 ${VB_W} ${totalH}`} className="mt-svg" preserveAspectRatio="xMidYMid meet">
        {Y_TICKS.map(v => (
          <g key={v}>
            <line x1={PAD_LEFT} y1={yAt(v)} x2={VB_W - PAD_R} y2={yAt(v)} stroke="#F1F5F9" strokeWidth={1} />
            <text x={PAD_LEFT - 4} y={yAt(v) + 3} textAnchor="end" fontSize={7} fill="#CBD5E1">{v}</text>
          </g>
        ))}
        {visibleMarkers.map(m => (
          <g key={m.id}>
            <line x1={xFrac(m.fraction)} y1={plotTop} x2={xFrac(m.fraction)} y2={plotBottom}
              stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 2" />
            <circle cx={xFrac(m.fraction)} cy={plotTop} r={6} fill="#475569" />
            <text x={xFrac(m.fraction)} y={plotTop + 2.5} textAnchor="middle" fontSize={7}
              fontWeight="bold" fill="#fff">{m.index}</text>
          </g>
        ))}
        {series.map(d => (
          <polyline key={d.id} points={lineFor(d.values, plotTop, plotH)} fill="none"
            stroke={d.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
        ))}
        <polyline points={lineFor(avg, plotTop, plotH)} fill="none" stroke="#fff" strokeWidth={3.5}
          strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={lineFor(avg, plotTop, plotH)} fill="none" stroke="#64748B" strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />
        {xLabels.map(({ i, label }) => {
          const x = PAD_LEFT + (i / (n - 1)) * (VB_W - PAD_LEFT - PAD_R)
          return <text key={i} x={x} y={labelY} textAnchor="middle" fontSize={7} fill="#9CA3AF">{label}</text>
        })}
      </svg>
      <div className="mt-legend">
        {series.map(d => (
          <span key={d.id} className="mt-legend__item">
            <span className="mt-legend__dot" style={{ background: d.color }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
