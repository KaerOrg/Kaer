import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg'
import { colors, spacing } from '../theme'
import type { ExposureSession } from '../lib/database'

// ─── Dimensions ───────────────────────────────────────────────────────────────

const CHART_H = 180
const PAD = { top: 14, bottom: 28, left: 38, right: 14 }
const PLOT_H = CHART_H - PAD.top - PAD.bottom
const GRID_VALUES = [0, 25, 50, 75, 100]

// ─── Helpers coordonnées ──────────────────────────────────────────────────────

function sudsToY(suds: number): number {
  return PAD.top + (1 - suds / 100) * PLOT_H
}

function sessionToX(index: number, total: number, w: number): number {
  const plotW = w - PAD.left - PAD.right
  if (total <= 1) return PAD.left + plotW / 2
  return PAD.left + (index / (total - 1)) * plotW
}

// ─── Courbe lissée (cubic bezier) ────────────────────────────────────────────

function smoothPath(points: { x: number; y: number }[]): string {
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

function areaPath(points: { x: number; y: number }[], bottomY: number): string {
  if (points.length === 0) return ''
  const linePart = smoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${linePart} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface DesensitizationChartProps {
  sessions: ExposureSession[]
  initialSuds: number       // ligne de référence pointillée
  width: number
  accentColor?: string
}

export function DesensitizationChart({
  sessions,
  initialSuds,
  width,
  accentColor = colors.primary,
}: DesensitizationChartProps) {
  const points = useMemo(
    () =>
      sessions.map((s, i) => ({
        x: sessionToX(i, sessions.length, width),
        y: sudsToY(s.suds_score),
        suds: s.suds_score,
        date: s.session_date,
      })),
    [sessions, width]
  )

  const bottomY = sudsToY(0)
  const refY = sudsToY(initialSuds)

  // Dashes pour la ligne de référence (SUDS initial estimé)
  const refDashes = useMemo(() => {
    const plotW = width - PAD.left - PAD.right
    const count = Math.floor(plotW / 10)
    return Array.from({ length: count }, (_, i) => PAD.left + i * 10)
  }, [width])

  return (
    <Svg width={width} height={CHART_H}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accentColor} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={accentColor} stopOpacity={0.01} />
        </LinearGradient>
      </Defs>

      {/* Lignes de grille horizontales */}
      {GRID_VALUES.map((v) => {
        const y = sudsToY(v)
        return (
          <React.Fragment key={v}>
            <Line
              x1={PAD.left}
              y1={y}
              x2={width - PAD.right}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={v === 0 || v === 100 ? undefined : '3 4'}
            />
            <SvgText
              x={PAD.left - 6}
              y={y + 4}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="end"
            >
              {v}
            </SvgText>
          </React.Fragment>
        )
      })}

      {/* Ligne de référence — SUDS initial estimé */}
      {refDashes.map((x) => (
        <Line
          key={x}
          x1={x}
          y1={refY}
          x2={x + 5}
          y2={refY}
          stroke={accentColor}
          strokeWidth={1.5}
          strokeOpacity={0.4}
        />
      ))}

      {/* Zone sous la courbe */}
      {points.length >= 2 && (
        <Path
          d={areaPath(points, bottomY)}
          fill="url(#areaGrad)"
        />
      )}

      {/* Courbe principale */}
      {points.length >= 2 && (
        <Path
          d={smoothPath(points)}
          fill="none"
          stroke={accentColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Points par session */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          {/* Halo */}
          <Circle cx={p.x} cy={p.y} r={8} fill={accentColor} fillOpacity={0.12} />
          {/* Dot */}
          <Circle cx={p.x} cy={p.y} r={4} fill={accentColor} />
          {/* Score au-dessus */}
          <SvgText
            x={p.x}
            y={p.y - 12}
            fontSize={10}
            fontWeight="700"
            fill={accentColor}
            textAnchor="middle"
          >
            {p.suds}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Labels X — numéros de séances */}
      {points.map((p, i) => (
        <SvgText
          key={i}
          x={p.x}
          y={CHART_H - 6}
          fontSize={10}
          fill={colors.textMuted}
          textAnchor="middle"
        >
          {`S${i + 1}`}
        </SvgText>
      ))}
    </Svg>
  )
}

// ─── Mini sparkline (vue liste) ───────────────────────────────────────────────

const SPARK_H = 36
const SPARK_PAD = { top: 4, bottom: 4, left: 4, right: 4 }
const SPARK_PLOT_H = SPARK_H - SPARK_PAD.top - SPARK_PAD.bottom

function sparkY(suds: number): number {
  return SPARK_PAD.top + (1 - suds / 100) * SPARK_PLOT_H
}

interface MiniSparklineProps {
  sessions: ExposureSession[]
  width: number
  accentColor?: string
}

export function MiniSparkline({ sessions, width, accentColor = colors.primary }: MiniSparklineProps) {
  const pts = useMemo(() => {
    const last5 = sessions.slice(-5)
    return last5.map((s, i) => ({
      x: SPARK_PAD.left + (last5.length <= 1 ? (width - SPARK_PAD.left - SPARK_PAD.right) / 2 : (i / (last5.length - 1)) * (width - SPARK_PAD.left - SPARK_PAD.right)),
      y: sparkY(s.suds_score),
    }))
  }, [sessions, width])

  if (pts.length === 0) return null

  return (
    <Svg width={width} height={SPARK_H}>
      {pts.length >= 2 && (
        <Path
          d={smoothPath(pts)}
          fill="none"
          stroke={accentColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={accentColor} />
      ))}
    </Svg>
  )
}

// ─── Légende référence ────────────────────────────────────────────────────────

export function ChartLegend({ accentColor = colors.primary }: { accentColor?: string }) {
  return (
    <View style={legendStyles.row}>
      <View style={legendStyles.item}>
        <View style={[legendStyles.dot, { backgroundColor: accentColor }]} />
        <Text style={legendStyles.label}>Séances réalisées</Text>
      </View>
      <View style={legendStyles.item}>
        <View style={[legendStyles.dash, { borderColor: accentColor }]} />
        <Text style={legendStyles.label}>SUDs estimé au départ</Text>
      </View>
    </View>
  )
}

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dash: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  label: { fontSize: 11, color: colors.textMuted },
})
