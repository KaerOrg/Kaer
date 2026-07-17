import { useCallback, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart as RechartsLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot,
} from 'recharts'
import {
  computeTrendMean, lastFilledPoint, eventDates, formatTrendValue, mergeTrendSeries,
  type TrendPoint,
} from './trendMath'
import './TrendChart.css'

// Repère daté vertical (Life Chart) tracé en travers du graphe. La couleur encode
// l'identité (type de repère), jamais une gravité clinique (MDR). NB : l'axe X
// étant catégoriel, un repère n'apparaît qu'à une date présente dans les données.
export interface TrendMarker {
  date: string
  label: string
  color?: string
}

export interface TrendChartProps {
  /** Série principale, un point par nuit (valeur `null` = nuit non renseignée). */
  data: TrendPoint[]
  /** Unité de la métrique (« % », « h », « min », « /5 »…) — axe Y, moyenne, tooltip. */
  unit?: string
  /** Bornes de l'axe Y. */
  yDomain: [number, number]
  /** Couleur d'accent de la métrique. Défaut : teal. */
  color?: string
  /** Préfixe de la ligne de moyenne (ex. « moy. »). Sans lui, pas de ligne de moyenne. */
  meanLabel?: string
  /** Série de référence optionnelle (pointillés gris) — comparaison de période. */
  comparison?: { data: TrendPoint[]; label: string }
  /** Repères datés verticaux (traitement, événement…) tracés en travers. */
  markers?: TrendMarker[]
  locale?: string
  height?: number
}

const AXIS_COLOR = '#94A3B8'
const GRID_COLOR = '#F1F5F9'
const REF_COLOR = '#94A3B8'
const DEFAULT_COLOR = 'var(--color-primary)'

interface TooltipEntry { dataKey?: string | number; value?: number | string; color?: string }
interface TooltipContentProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  unit: string
  locale: string
  comparisonLabel?: string
}

// Module-level : Recharts l'invoque via la prop `content` (fonction de rendu stable).
function TrendTooltip({ active, payload, label, unit, locale, comparisonLabel }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const date = label
    ? new Date(`${label}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  return (
    <div className="trend-chart__tooltip">
      <p className="trend-chart__tooltip-date">{date}</p>
      {payload.map((entry, i) => {
        if (entry.value == null) return null
        const isRef = String(entry.dataKey) === 'ref'
        return (
          <div key={i} className="trend-chart__tooltip-row">
            <span className="trend-chart__tooltip-dot" style={{ background: String(entry.color) }} />
            <span className="trend-chart__tooltip-label">{isRef ? comparisonLabel : ''}</span>
            <strong className="trend-chart__tooltip-value">
              {formatTrendValue(typeof entry.value === 'number' ? entry.value : Number(entry.value), unit)}
            </strong>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Graphe de tendance précis (praticien) : axe Y chiffré + unité, un point par nuit,
 * ligne de moyenne pointillée + valeur, dernière valeur mise en avant, marqueurs
 * d'événement (cauchemars) sur l'axe, série de comparaison optionnelle. Valeurs
 * brutes, aucune interprétation automatique. Primitif générique (métrique injectée).
 */
export function TrendChart({
  data, unit = '', yDomain, color = DEFAULT_COLOR,
  meanLabel, comparison, markers, locale = 'fr-FR', height = 240,
}: TrendChartProps) {
  const merged = useMemo(() => mergeTrendSeries(data, comparison?.data), [data, comparison])
  const mean = useMemo(() => computeTrendMean(data), [data])
  const last = useMemo(() => lastFilledPoint(data), [data])
  const events = useMemo(() => eventDates(data), [data])

  const formatXTick = useCallback(
    (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    [locale],
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={merged} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date" tickFormatter={formatXTick}
          tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false}
          interval={Math.max(0, Math.floor(merged.length / 8))} dy={4} minTickGap={24}
        />
        <YAxis
          domain={yDomain} unit={unit} tick={{ fontSize: 11, fill: AXIS_COLOR }}
          axisLine={false} tickLine={false} width={44}
        />
        <Tooltip
          content={<TrendTooltip unit={unit} locale={locale} comparisonLabel={comparison?.label} />}
          cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
        />

        {meanLabel && mean != null ? (
          <ReferenceLine
            y={mean} stroke={color} strokeDasharray="5 5" strokeWidth={1.5}
            label={{ value: `${meanLabel} ${formatTrendValue(mean, unit)}`, position: 'insideTopRight', fill: color, fontSize: 11, fontWeight: 700 }}
          />
        ) : null}

        {comparison ? (
          <Line
            dataKey="ref" type="monotone" stroke={REF_COLOR} strokeDasharray="5 5"
            strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false}
          />
        ) : null}

        {markers?.map(m => (
          <ReferenceLine
            key={`${m.date}-${m.label}`}
            x={m.date} stroke={m.color ?? REF_COLOR} strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: m.label, position: 'top', fill: m.color ?? REF_COLOR, fontSize: 10, fontWeight: 700 }}
          />
        ))}

        <Line
          dataKey="value" type="monotone" stroke={color} strokeWidth={2.5}
          dot={{ r: 3, fill: color, stroke: 'white', strokeWidth: 1.5 }}
          activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
          connectNulls={false} isAnimationActive={false}
        />

        {last ? (
          <ReferenceDot x={last.date} y={last.value} r={6} fill={color} stroke="white" strokeWidth={2.5} />
        ) : null}

        {events.map(date => (
          <ReferenceDot
            key={date} x={date} y={yDomain[0]} r={4}
            fill="white" stroke={color} strokeWidth={2}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
