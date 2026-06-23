import React from 'react'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import { colors } from '@theme'
import type { DataPoint, XLabel } from './chartTypes'

const SVG_W = 280
const DATA_H = 56
const LABEL_H = 14
const SVG_H = DATA_H + LABEL_H
const PAD_X = 6
const PAD_Y = 6

export interface LineChartProps {
  points: DataPoint[]
  color: string
  xLabels: XLabel[]
  /** Valeur maximale de l'axe Y (défaut 3). */
  maxY?: number
}

/**
 * Graphique linéaire SVG — courbes interrompues sur les gaps (`hasValue: false`),
 * marqueurs circulaires sur chaque point présent, étiquettes d'axe X optionnelles.
 * Primitif pur : aucune logique métier.
 */
export function LineChart({ points, color, xLabels, maxY = 3 }: LineChartProps) {
  const n = points.length
  if (n === 0) return null

  const innerW = SVG_W - PAD_X * 2
  const innerH = DATA_H - PAD_Y * 2

  const xAt = (i: number) => PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_Y + innerH - (v / maxY) * innerH

  const segments: string[][] = []
  let current: string[] = []
  for (let i = 0; i < n; i++) {
    if (points[i].hasValue) {
      current.push(`${xAt(i).toFixed(1)},${yAt(points[i].value).toFixed(1)}`)
    } else {
      if (current.length > 1) segments.push(current)
      current = []
    }
  }
  if (current.length > 1) segments.push(current)

  const baseY = yAt(0)
  const labelY = DATA_H + LABEL_H - 2

  return (
    <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
      <Line x1={PAD_X} y1={baseY} x2={SVG_W - PAD_X} y2={baseY} stroke={colors.border} strokeWidth="1" />
      {segments.map((seg, si) => (
        <Polyline
          key={si}
          points={seg.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {points.map((p, i) => {
        if (!p.hasValue) return null
        return (
          <Circle
            key={i}
            cx={xAt(i)}
            cy={yAt(p.value)}
            r={n <= 12 ? 3.5 : 2.5}
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        )
      })}
      {xLabels.map(({ index, label }) => (
        <SvgText
          key={`xl_${index}`}
          x={xAt(index)}
          y={labelY}
          textAnchor="middle"
          fontSize={n > 12 ? '7' : '8'}
          fill={colors.textMuted}
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  )
}
