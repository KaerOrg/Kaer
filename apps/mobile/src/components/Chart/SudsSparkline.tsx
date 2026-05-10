import React, { useMemo } from 'react'
import Svg, { Path, Circle } from 'react-native-svg'
import { colors } from '../../theme'
import {
  type SudsPoint,
  type ChartPadding,
  sudsToY,
  pointToX,
  smoothPath,
} from './sudsChartUtils'

const SPARK_H = 36
const SPARK_PAD: ChartPadding = { top: 4, bottom: 4, left: 4, right: 4 }
const MAX_POINTS = 5

export interface SudsSparklineProps {
  points: readonly SudsPoint[]
  width: number
  accentColor?: string
}

// Mini ligne SUDs (vue liste / carte récapitulative). Affiche les `MAX_POINTS`
// dernières séances. Pas d'axe, pas de label — juste la trajectoire visuelle.
// MDR : même règle que DesensitizationChart — affichage brut, aucune
// interprétation par couleur ou flèche.
export function SudsSparkline({ points, width, accentColor = colors.primary }: SudsSparklineProps) {
  const xy = useMemo(() => {
    const last = points.slice(-MAX_POINTS)
    return last.map((p, i) => ({
      x: pointToX(i, last.length, width, SPARK_PAD),
      y: sudsToY(p.score, SPARK_H, SPARK_PAD),
    }))
  }, [points, width])

  if (xy.length === 0) return null

  return (
    <Svg width={width} height={SPARK_H}>
      {xy.length >= 2 && (
        <Path
          d={smoothPath(xy)}
          fill="none"
          stroke={accentColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
      {xy.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={accentColor} />
      ))}
    </Svg>
  )
}
