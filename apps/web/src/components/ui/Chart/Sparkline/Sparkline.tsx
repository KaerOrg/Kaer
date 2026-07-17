import { useMemo } from 'react'
import { sparklinePoints } from './sparklineMath'

// ─── Sparkline — mini-courbe de tendance sans axes ───────────────────────────
//
// Micro-visualisation générique (bandeau d'aperçu Évolution, #159) : polyline SVG
// bornée par un `domain` explicite, segments interrompus sur les valeurs `null`
// (saisies manquantes). Aucune logique métier, aucune grille de valeur imposée.
// Valeurs brutes tracées (MDR : pas d'interprétation).

export interface SparklineProps {
  /** Série (une valeur par pas), `null` = donnée manquante (interruption). */
  readonly data: readonly (number | null)[]
  readonly color: string
  /** Bornes [min, max] de l'axe vertical (échelle propre à la métrique). */
  readonly domain: readonly [number, number]
  readonly width?: number
  readonly height?: number
  readonly testID?: string
}

export function Sparkline({ data, color, domain, width = 120, height = 34, testID }: SparklineProps) {
  const segments = useMemo(
    () => sparklinePoints(data, domain, width, height),
    [data, domain, width, height],
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`} width="100%" height={height}
      preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}
      data-testid={testID}
    >
      {segments.map((pts, i) => (
        <polyline
          key={i} points={pts} fill="none" stroke={color}
          strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
