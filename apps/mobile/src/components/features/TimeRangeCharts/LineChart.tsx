import React from 'react'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import type { DataPoint, XLabel } from './chartUtils'

const SVG_W = 280
const DATA_H = 56
const LABEL_H = 14
const SVG_H = DATA_H + LABEL_H
const PAD_LEFT = 16   // gouttière pour les graduations Y
const PAD_X = 6
const PAD_Y = 6

interface Props {
  points: DataPoint[]
  color: string
  xLabels: XLabel[]
  /** Valeur maximale de l'axe Y (3 pour effets secondaires, 10 pour mood tracker) */
  yMax?: number
}

export function LineChart({ points, color, xLabels, yMax = 10 }: Props) {
  const n = points.length
  if (n === 0) return null

  const innerW = SVG_W - PAD_LEFT - PAD_X
  const innerH = DATA_H - PAD_Y * 2

  // Graduations Y : extrêmes uniquement pour les petits graphes (max + milieu)
  const yTicks = yMax >= 10 ? [10, 5] : [yMax]

  const xAt = (i: number) => PAD_LEFT + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_Y + innerH - (v / yMax) * innerH

  // Tous les points avec valeur connectés en une seule ligne (saute les jours vides)
  const linePoints = points
    .map((p, i) => p.hasValue ? `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}` : null)
    .filter((s): s is string => s !== null)

  const baseY = yAt(0)
  const labelY = DATA_H + LABEL_H - 2

  return (
    <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
      {/* Graduations Y + lignes horizontales de repère */}
      {yTicks.map(v => (
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
      <Line
        x1={PAD_LEFT} y1={baseY}
        x2={SVG_W - PAD_X} y2={baseY}
        stroke="#E5E7EB"
        strokeWidth="1"
      />
      {linePoints.length >= 2 && (
        <Polyline
          points={linePoints.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
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
          fill="#9CA3AF"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  )
}
