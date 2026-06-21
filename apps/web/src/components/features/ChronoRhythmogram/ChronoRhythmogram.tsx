import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  Label,
} from 'recharts'
import { minutesToHourLabel, minutesToClock } from '@psytool/shared'
import type { RhythmogramAnchor } from '../../../lib/chronoAnchors'
import './ChronoRhythmogram.css'

interface Props {
  data: Record<string, number | null>[]
  anchors: RhythmogramAnchor[]
  yDomain: [number, number]
  weekStarts: number[]
  year: number
  month: number // 1-12
  locale: string
  /** Titres d'axes (déjà traduits) — fournis par l'appelant pour rester générique. */
  xAxisLabel?: string
  yAxisLabel?: string
}

const AXIS_LABEL_STYLE = { fontSize: 11, fill: '#94A3B8' } as const

interface TooltipEntry { dataKey?: string | number; value?: number; color?: string }
interface TooltipContentProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: number
  anchors: RhythmogramAnchor[]
  year: number
  month: number
  locale: string
}

// Module-level (jamais recréé au render) — Recharts l'invoque via `content`.
function TooltipContent({ active, payload, label, anchors, year, month, locale }: TooltipContentProps) {
  if (!active || !payload?.length || label == null) return null
  const dateStr = new Date(year, month - 1, label).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return (
    <div className="rhythmogram__tooltip">
      <p className="rhythmogram__tooltip-date">{dateStr}</p>
      {payload.map((entry, i) => {
        const a = anchors.find(an => an.key === String(entry.dataKey))
        if (!a || entry.value == null) return null
        return (
          <div key={i} className="rhythmogram__tooltip-row">
            <span className="rhythmogram__tooltip-dot" style={{ background: a.color }} />
            <span className="rhythmogram__tooltip-label">{a.label}</span>
            <strong className="rhythmogram__tooltip-time">{minutesToClock(entry.value)}</strong>
          </div>
        )
      })}
    </div>
  )
}

function buildHourTicks(domain: [number, number]): number[] {
  const ticks: number[] = []
  const start = Math.ceil(domain[0] / 120) * 120
  for (let m = start; m <= domain[1]; m += 120) ticks.push(m)
  return ticks
}

/**
 * Rythmogramme : l'heure de chaque repère tracée jour par jour sur un mois.
 * Ligne plate = rythme régulier ; bosses récurrentes = décalage (un jour de
 * semaine qui dérape). Traits verticaux = débuts de semaine (repères).
 * Conforme MDR : horaires bruts tracés, aucune interprétation ni seuil.
 */
export function ChronoRhythmogram({ data, anchors, yDomain, weekStarts, year, month, locale, xAxisLabel, yAxisLabel }: Props) {
  const hourTicks = buildHourTicks(yDomain)
  const plotted = anchors.filter(a => a.count >= 1)

  return (
    <div className="rhythmogram">
      <ResponsiveContainer width="100%" height={248}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: xAxisLabel ? 16 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          {weekStarts.map(d => (
            <ReferenceLine key={d} x={d} stroke="#E2E8F0" strokeWidth={1} />
          ))}
          <XAxis
            dataKey="day"
            type="number"
            domain={[1, data.length]}
            ticks={weekStarts}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            dy={4}
          >
            {xAxisLabel != null && (
              <Label value={xAxisLabel} position="insideBottom" offset={-6} style={AXIS_LABEL_STYLE} />
            )}
          </XAxis>
          <YAxis
            domain={yDomain}
            ticks={hourTicks}
            tickFormatter={minutesToHourLabel}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            width={yAxisLabel ? 48 : 36}
            reversed
          >
            {yAxisLabel != null && (
              <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ ...AXIS_LABEL_STYLE, textAnchor: 'middle' }} />
            )}
          </YAxis>
          <Tooltip
            content={<TooltipContent anchors={anchors} year={year} month={month} locale={locale} />}
            cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
          />
          {plotted.map(a => (
            <Line
              key={a.key}
              type="monotone"
              dataKey={a.key}
              stroke={a.color}
              strokeWidth={2}
              dot={{ r: 2.5, fill: a.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: a.color, stroke: 'white', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="rhythmogram__legend">
        {plotted.map(a => (
          <span key={a.key} className="rhythmogram__legend-item">
            <span className="rhythmogram__legend-dot" style={{ background: a.color }} />
            {a.label}
            <span className="rhythmogram__legend-sd">±{a.sdMinutes} min</span>
          </span>
        ))}
      </div>
    </div>
  )
}
