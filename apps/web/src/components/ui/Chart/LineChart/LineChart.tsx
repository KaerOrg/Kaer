import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface SeriesConfig {
  key: string
  color: string
  label?: string
}

interface Props {
  data: Record<string, number | string>[]
  series: SeriesConfig[]
  yDomain?: [number, number]
  xKey?: string
  height?: number
  showLegend?: boolean
  locale?: string
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string
  color?: string
}

interface TooltipArgs {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function buildTooltipContent(seriesList: SeriesConfig[], locale: string) {
  return function TooltipContent({ active, payload, label }: TooltipArgs) {
    if (!active || !payload?.length) return null
    const date = label
      ? new Date(label).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    return (
      <div style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        minWidth: 160,
      }}>
        <p style={{ color: '#64748B', margin: '0 0 8px', fontWeight: 600, fontSize: 11, letterSpacing: '0.02em' }}>
          {date}
        </p>
        {payload.map((entry, i) => {
          const s = seriesList.find(s => s.key === String(entry.dataKey))
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '3px 0' }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: String(entry.color), flexShrink: 0,
              }} />
              <span style={{ color: '#475569' }}>
                {s?.label ?? String(entry.dataKey)}
              </span>
              <strong style={{ marginLeft: 'auto', color: '#1E293B', fontSize: 13 }}>
                {entry.value}
              </strong>
            </div>
          )
        })}
      </div>
    )
  }
}

export function LineChart({
  data,
  series,
  yDomain,
  xKey = 'date',
  height = 200,
  showLegend = false,
  locale = 'fr-FR',
}: Props) {
  if (data.length < 2) return null

  const isSingleSeries = series.length === 1
  const TooltipContent = buildTooltipContent(series, locale)

  const formatTick = (value: string) =>
    new Date(value).toLocaleDateString(locale, { month: 'short' })

  const sharedAxisProps = {
    xAxis: (
      <XAxis
        dataKey={xKey}
        tickFormatter={formatTick}
        tick={{ fontSize: 11, fill: '#94A3B8' }}
        axisLine={false}
        tickLine={false}
        interval={Math.max(0, Math.floor(data.length / 10))}
        dy={4}
      />
    ),
    yAxis: (
      <YAxis
        domain={yDomain}
        tick={{ fontSize: 11, fill: '#94A3B8' }}
        axisLine={false}
        tickLine={false}
        width={36}
      />
    ),
    grid: (
      <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
    ),
    tooltip: <Tooltip content={<TooltipContent />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />,
  }

  if (isSingleSeries) {
    const { key, color } = series[0]
    const gradientId = `grad_${key}`
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* SVG defs natively injected — gradient fill sous la courbe */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {sharedAxisProps.grid}
          {sharedAxisProps.xAxis}
          {sharedAxisProps.yAxis}
          {sharedAxisProps.tooltip}
          <Area
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        {sharedAxisProps.grid}
        {sharedAxisProps.xAxis}
        {sharedAxisProps.yAxis}
        {sharedAxisProps.tooltip}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ color: '#64748B' }}>
                {series.find(s => s.key === value)?.label ?? value}
              </span>
            )}
          />
        )}
        {series.map(s => (
          <Line
            key={s.key}
            type="basis"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: s.color, stroke: 'white', strokeWidth: 2 }}
            name={s.key}
            connectNulls={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
