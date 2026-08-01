import { useCallback, type CSSProperties } from 'react'
import './WeekRhythmLine.css'

export interface WeekRhythmLineProps {
  /** Jours actifs, en ISO 1 (lundi) à 7 (dimanche). */
  selectedDays: readonly number[]
  onToggle: (iso: number) => void
  /** 7 libellés courts, ordre lundi → dimanche, déjà traduits. */
  dayLabels: readonly string[]
  /** Libellé accessible de chaque jour : `(iso, actif) => string`. Défaut : le libellé court. */
  dayAriaLabel?: (iso: number, active: boolean) => string
  /** Couleur d'accent des arrêts actifs et du fil. Défaut : accent primaire du thème. */
  accentColor?: string
  className?: string
}

const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const
const DEFAULT_ACCENT = 'var(--color-primary)'

/**
 * Sélecteur « ligne de la semaine » : les 7 jours sur un rail continu, les jours
 * actifs sont des arrêts pleins reliés à leur voisin actif par un fil d'accent.
 * Rend le rythme hebdomadaire lisible d'un coup d'œil (vs cases isolées).
 *
 * Primitive pur du design system : aucune connaissance métier ni i18n. Les libellés
 * (jours, a11y) sont fournis déjà traduits par l'appelant. Chaque arrêt est une case
 * à cocher (`role="checkbox"`), pas un bouton d'action.
 */
export function WeekRhythmLine({
  selectedDays,
  onToggle,
  dayLabels,
  dayAriaLabel,
  accentColor = DEFAULT_ACCENT,
  className = '',
}: WeekRhythmLineProps) {
  const isActive = useCallback((iso: number) => selectedDays.includes(iso), [selectedDays])

  return (
    <div className={`wrl ${className}`} role="group">
      {ISO_DAYS.map((iso, i) => {
        const active = isActive(iso)
        // Fil vers le jour précédent : teal seulement si les deux voisins sont actifs.
        const linked = i > 0 && active && isActive(ISO_DAYS[i - 1])
        const dotStyle: CSSProperties = active
          ? { background: accentColor, borderColor: accentColor }
          : {}
        const connectorStyle: CSSProperties = linked ? { background: accentColor } : {}
        return (
          <div key={iso} className="wrl__day">
            <span className="wrl__slot">
              {i > 0 ? <span className="wrl__connector" style={connectorStyle} aria-hidden /> : null}
              <button
                type="button"
                role="checkbox"
                aria-checked={active}
                aria-label={dayAriaLabel ? dayAriaLabel(iso, active) : dayLabels[i]}
                className={`wrl__dot ${active ? 'wrl__dot--on' : ''}`}
                style={dotStyle}
                onClick={() => onToggle(iso)}
              />
            </span>
            <span className={`wrl__label ${active ? 'wrl__label--on' : ''}`}>{dayLabels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}
