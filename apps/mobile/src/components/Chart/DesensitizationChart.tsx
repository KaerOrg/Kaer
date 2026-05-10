import React, { useMemo } from 'react'
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg'
import { colors } from '../../theme'
import {
  type SudsPoint,
  type ChartPadding,
  sudsToY,
  pointToX,
  smoothPath,
  areaPath,
} from './sudsChartUtils'

const CHART_H = 180
const PAD: ChartPadding = { top: 14, bottom: 28, left: 38, right: 14 }
const GRID_VALUES = [0, 25, 50, 75, 100] as const

export interface DesensitizationChartProps {
  /** Points triés chronologiquement (1 par séance). */
  points: readonly SudsPoint[]
  /** Ligne de référence pointillée — typiquement le SUDs initial estimé. */
  referenceScore: number
  /** Largeur disponible — passée par le parent (mesure du conteneur). */
  width: number
  /** Couleur d'accent — défaut: colors.primary. */
  accentColor?: string
}

// Graphique de désensibilisation (TCC exposure). Affiche l'évolution des
// scores SUDs séance par séance + ligne de référence du SUDs initial.
// MDR : aucune interprétation — juste l'affichage des chiffres bruts saisis
// par le patient. La courbe lissée est un choix esthétique, pas une
// extrapolation clinique.
export function DesensitizationChart({
  points,
  referenceScore,
  width,
  accentColor = colors.primary,
}: DesensitizationChartProps) {
  const xy = useMemo(
    () =>
      points.map((p, i) => ({
        x: pointToX(i, points.length, width, PAD),
        y: sudsToY(p.score, CHART_H, PAD),
        score: p.score,
      })),
    [points, width]
  )

  const bottomY = sudsToY(0, CHART_H, PAD)
  const refY = sudsToY(referenceScore, CHART_H, PAD)

  const refDashes = useMemo(() => {
    const plotW = width - PAD.left - PAD.right
    const count = Math.floor(plotW / 10)
    return Array.from({ length: count }, (_, i) => PAD.left + i * 10)
  }, [width])

  return (
    <Svg width={width} height={CHART_H}>
      <Defs>
        <LinearGradient id="sudsAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accentColor} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={accentColor} stopOpacity={0.01} />
        </LinearGradient>
      </Defs>

      {GRID_VALUES.map(v => {
        const y = sudsToY(v, CHART_H, PAD)
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

      {refDashes.map(x => (
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

      {xy.length >= 2 && <Path d={areaPath(xy, bottomY)} fill="url(#sudsAreaGrad)" />}
      {xy.length >= 2 && (
        <Path
          d={smoothPath(xy)}
          fill="none"
          stroke={accentColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {xy.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={8} fill={accentColor} fillOpacity={0.12} />
          <Circle cx={p.x} cy={p.y} r={4} fill={accentColor} />
          <SvgText
            x={p.x}
            y={p.y - 12}
            fontSize={10}
            fontWeight="700"
            fill={accentColor}
            textAnchor="middle"
          >
            {p.score}
          </SvgText>
        </React.Fragment>
      ))}

      {xy.map((p, i) => (
        <SvgText
          key={`x-${i}`}
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
