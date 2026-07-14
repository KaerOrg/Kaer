import { clockFraction, rangeToSegments } from './anchorRangeGeometry'
import './AnchorRangeBar.css'

interface Props {
  /** Couleur d'identité du repère (catégorielle, pas une teinte de gravité — MDR). */
  color: string
  /** Horaires min / médiane / max en minutes déroulées ; `null` = repère non renseigné. */
  min: number | null
  median: number | null
  max: number | null
  /** Libellé accessible décrivant la plage (déjà traduit et formaté). */
  ariaLabel?: string
}

/**
 * Barre de PLAGE horaire d'un repère sur un axe 0 h → 24 h : segment min→max teinté
 * à la couleur d'identité du repère + point médian. Purement descriptive (aucun seuil
 * ni couleur de gravité — MDR 2017/745). Mutualisée par l'onglet Données (cellule
 * « Plage ») et la carte de suivi Évolution.
 */
export function AnchorRangeBar({ color, min, median, max, ariaLabel }: Props) {
  const hasData = min !== null && max !== null && median !== null
  return (
    <div className="anchor-range-bar" role="img" aria-label={ariaLabel}>
      <div className="anchor-range-bar__track">
        {hasData ? (
          <>
            {rangeToSegments(min, max).map(([start, end], i) => (
              <div
                key={i}
                className="anchor-range-bar__segment"
                style={{ left: `${start * 100}%`, width: `${(end - start) * 100}%`, background: color }}
              />
            ))}
            <div
              className="anchor-range-bar__median"
              style={{ left: `${clockFraction(median) * 100}%`, background: color }}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
