import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import { colors, spacing, radius } from '../../../theme'
import type { DataPoint, XLabel } from './chartUtils'

const SVG_W = 280
const DATA_H = 80
const LABEL_H = 14
const SVG_H = DATA_H + LABEL_H
const PAD_LEFT = 16   // gouttière pour les graduations Y
const PAD_X = 6
const PAD_Y = 6

export interface ChartMarker {
  id: string
  index: number     // numéro affiché (1, 2, 3…)
  fraction: number  // position horizontale 0..1
}

interface DimensionSeries {
  key: string
  label: string
  color: string
  points: DataPoint[]
}

interface Props {
  series: DimensionSeries[]
  /** Points moyens calculés en dehors (buildCompositeData) */
  avgPoints: DataPoint[]
  xLabels: XLabel[]
  avgLabel: string
  legendLabel: string
  yMax?: number
  markers?: ChartMarker[]
}

// Graduations Y affichées
const Y_TICKS = [10, 5, 1]

export function CompositeChart({
  series,
  avgPoints,
  xLabels,
  avgLabel,
  legendLabel,
  yMax = 10,
  markers = [],
}: Props) {
  const n = avgPoints.length
  if (n === 0) return null

  const innerW = SVG_W - PAD_LEFT - PAD_X
  const innerH = DATA_H - PAD_Y * 2

  const xAt = (i: number) => PAD_LEFT + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const xAtFraction = (f: number) => PAD_LEFT + f * innerW
  const yAt = (v: number) => PAD_Y + innerH - (v / yMax) * innerH

  const buildLine = (pts: DataPoint[]): string[] =>
    pts
      .map((p, i) => p.hasValue ? `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}` : null)
      .filter((s): s is string => s !== null)

  const labelY = DATA_H + LABEL_H - 2

  const validAvg = avgPoints.filter(p => p.hasValue)
  const avgVal = validAvg.length > 0
    ? (validAvg.reduce((s, p) => s + p.value, 0) / validAvg.length).toFixed(1)
    : '—'

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{legendLabel}</Text>
        <Text style={styles.avg}>
          {avgVal === '—' ? avgVal : avgLabel.replace('{{value}}', avgVal)}
        </Text>
      </View>

      <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
        {/* Graduations Y + lignes horizontales de repère */}
        {Y_TICKS.map(v => (
          <React.Fragment key={`grid_${v}`}>
            <Line
              x1={PAD_LEFT} y1={yAt(v)}
              x2={SVG_W - PAD_X} y2={yAt(v)}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
            <SvgText
              x={PAD_LEFT - 4}
              y={yAt(v) + 3}
              textAnchor="end"
              fontSize="7"
              fill="#CBD5E1"
            >
              {v}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Repères temporels — traits verticaux pointillés */}
        {markers.map(m => (
          <React.Fragment key={`marker_${m.id}`}>
            <Line
              x1={xAtFraction(m.fraction)} y1={PAD_Y}
              x2={xAtFraction(m.fraction)} y2={PAD_Y + innerH}
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <Circle
              cx={xAtFraction(m.fraction)} cy={PAD_Y}
              r="6"
              fill="#475569"
            />
            <SvgText
              x={xAtFraction(m.fraction)} y={PAD_Y + 2.5}
              textAnchor="middle"
              fontSize="7"
              fontWeight="bold"
              fill="#FFFFFF"
            >
              {m.index}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Dimension lines — thin, tous points connectés */}
        {series.map(({ key, color, points }) => {
          const line = buildLine(points)
          if (line.length < 2) return null
          return (
            <Polyline
              key={key}
              points={line.join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          )
        })}

        {/* Average line — thick, white/neutral */}
        {(() => {
          const avgLine = buildLine(avgPoints)
          if (avgLine.length < 2) return null
          return (
            <>
              <Polyline
                points={avgLine.join(' ')}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Polyline
                points={avgLine.join(' ')}
                fill="none"
                stroke="#64748B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )
        })()}

        {/* Average dots */}
        {avgPoints.map((p, i) => {
          if (!p.hasValue) return null
          return (
            <Circle
              key={`avg_dot_${i}`}
              cx={xAt(i)}
              cy={yAt(p.value)}
              r={n <= 12 ? 3 : 2}
              fill="#64748B"
              stroke="white"
              strokeWidth="1.5"
            />
          )
        })}

        {/* X-axis labels */}
        {xLabels.map(({ index, label }) => (
          <SvgText
            key={`xl_${index}`}
            x={xAt(index)}
            y={labelY}
            textAnchor="middle"
            fontSize={n > 12 ? '7' : '8'}
            fill="#9CA3AF"
          >
            {label}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {series.map(({ key, label, color }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: { fontSize: 13, fontWeight: '600', color: colors.text },
  avg: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, color: colors.textMuted },
})
