import { memo } from 'react'
import { RatingSelector } from '../../../../ui/RatingSelector'

const QUALITY_STEPS = [1, 2, 3, 4, 5]

export interface SleepPreviewNightProps {
  date: string
  variant: 'filled' | 'incomplete' | 'empty'
  /** Géométrie de la barre « fenêtre de sommeil » (%) — miroir du mobile. */
  window?: { left: number; width: number }
  start?: string
  end?: string
  duration?: string
  quality?: number
  qualityLabel: string
  incompleteLabel: string
  emptyLabel: string
}

// Une nuit de la liste « Vue patient » (aperçu praticien) — miroir de la ligne
// mobile : barre « fenêtre de sommeil » (segment coucher→lever) + horaires +
// durée + étoiles. Présentationnel et mémoïsé. Le teal code « renseigné », pas la
// qualité (MDR côté patient).
function SleepPreviewNightInner({
  date, variant, window, start, end, duration, quality,
  qualityLabel, incompleteLabel, emptyLabel,
}: SleepPreviewNightProps) {
  return (
    <li className={`sj-night${variant === 'filled' ? ' sj-night--filled' : ''}`}>
      <div className="sj-night__header">
        <span className="sj-night__date">{date}</span>
        {variant === 'filled' && quality != null ? (
          <RatingSelector
            variant="icon" icon="star" iconSize={12}
            label={qualityLabel} value={quality} steps={QUALITY_STEPS}
            showHeader={false} className="sj-night__stars"
          />
        ) : null}
      </div>

      {variant === 'filled' && window ? (
        <>
          <div className="sj-night__track">
            <span className="sj-night__segment" style={{ left: `${window.left}%`, width: `${window.width}%` }} />
          </div>
          <div className="sj-night__meta">
            <span className="sj-night__time">{start}</span>
            <span className="sj-night__duration">{duration}</span>
            <span className="sj-night__time">{end}</span>
          </div>
        </>
      ) : variant === 'incomplete' ? (
        <span className="sj-night__muted">{incompleteLabel}</span>
      ) : (
        <span className="sj-night__muted">{emptyLabel}</span>
      )}
    </li>
  )
}

export const SleepPreviewNight = memo(SleepPreviewNightInner)
