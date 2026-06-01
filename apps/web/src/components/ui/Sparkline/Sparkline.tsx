import './Sparkline.css'
import type { SparklineProps } from './Sparkline.types'

const DEFAULT_WIDTH = 80
const DEFAULT_HEIGHT = 24
const DEFAULT_COLOR = 'var(--color-primary)'

/**
 * Mini-courbe (sparkline) passive d'une série de valeurs — neutre, sans axe ni
 * commentaire (conforme MDR : affiche une tendance brute, n'interprète pas).
 */
export function Sparkline({
  values,
  color = DEFAULT_COLOR,
  min = 1,
  max = 10,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className,
}: SparklineProps) {
  if (values.length < 2) return null

  const span = max > min ? max - min : 1
  const step = width / (values.length - 1)
  const points = values
    .map((v, i) => `${i * step},${height - ((v - min) / span) * height}`)
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      className={className ? `sparkline ${className}` : 'sparkline'}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
