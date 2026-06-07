// Courbe de désensibilisation (aperçu praticien) — pics de stress (0–100) au fil
// des séances. Mirroir web du DesensitizationChart mobile finalisé : points
// chiffrés, axes titrés, sans légende ni ligne de référence.
// MDR 2017/745 : tracé neutre de valeurs brutes, aucun seuil/interprétation.

interface Props {
  /** Pics 0–100, ordre chronologique (1 par séance). */
  points: number[]
  yAxisLabel: string
  xAxisLabel: string
}

const VB_W = 280
const VB_H = 108
const PAD_LEFT = 22
const PAD_R = 10
const PLOT_TOP = 8
const PLOT_H = 76
const GRID = [0, 25, 50, 75, 100] as const
const ACCENT = 'var(--color-primary)'

export function DesensitizationChartPreview({ points, yAxisLabel, xAxisLabel }: Props) {
  const n = points.length
  const yAt = (v: number) => PLOT_TOP + PLOT_H - (v / 100) * PLOT_H
  const xAt = (i: number) =>
    n <= 1 ? VB_W / 2 : PAD_LEFT + (i / (n - 1)) * (VB_W - PAD_LEFT - PAD_R)

  const polyline = points.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')

  return (
    <div className="ej-chart">
      <span className="ej-chart__yaxis">{yAxisLabel}</span>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="ej-svg" preserveAspectRatio="xMidYMid meet">
        {GRID.map(v => (
          <g key={v}>
            <line
              x1={PAD_LEFT} y1={yAt(v)} x2={VB_W - PAD_R} y2={yAt(v)}
              stroke="var(--color-border)" strokeWidth={1}
              strokeDasharray={v === 0 || v === 100 ? undefined : '3 4'}
            />
            <text x={PAD_LEFT - 5} y={yAt(v) + 3} textAnchor="end" fontSize={7} fill="var(--color-text-muted)">{v}</text>
          </g>
        ))}

        {n >= 2 ? (
          <polyline
            points={polyline} fill="none" stroke={ACCENT}
            strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          />
        ) : null}

        {points.map((v, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(v)} r={3.5} fill={ACCENT} />
            <text x={xAt(i)} y={yAt(v) - 7} textAnchor="middle" fontSize={8} fontWeight="700" fill={ACCENT}>{v}</text>
            <text x={xAt(i)} y={VB_H - 4} textAnchor="middle" fontSize={7} fill="var(--color-text-muted)">{`S${i + 1}`}</text>
          </g>
        ))}
      </svg>
      <span className="ej-chart__xaxis">{xAxisLabel}</span>
    </div>
  )
}
