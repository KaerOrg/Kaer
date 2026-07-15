import './ProgressRing.css'
import type { ProgressRingProps } from './ProgressRing.types'

/**
 * Jauge circulaire remplie au prorata d'une valeur brute (SVG `circle` +
 * `stroke-dasharray`), avec label central optionnel. Une seule couleur d'accent —
 * aucun codage conditionnel selon un seuil : la valeur est affichée, jamais jugée.
 * Primitif pur du design system (zéro métier). Pendant web du `ProgressRing` mobile.
 * L'arc démarre en haut (12 h) et se remplit dans le sens horaire.
 */
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  strokeWidth = 10,
  color = 'var(--color-primary)',
  trackColor = 'var(--color-border)',
  label,
  sublabel,
  ariaLabel,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const center = size / 2

  return (
    <div
      className={`progress-ring ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} className="progress-ring__svg">
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={trackColor} strokeWidth={strokeWidth}
        />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {(label != null || sublabel != null) ? (
        <div className="progress-ring__center">
          {label != null ? <span className="progress-ring__label">{label}</span> : null}
          {sublabel != null ? <span className="progress-ring__sublabel">{sublabel}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
