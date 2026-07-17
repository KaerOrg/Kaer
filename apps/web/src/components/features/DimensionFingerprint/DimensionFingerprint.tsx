import './DimensionFingerprint.css'

// ─── Empreinte multi-dimensions — mini-graphe à barres verticales (web) ──────
//
// Miroir du composant mobile (#161) : on lit N symptômes bruts, jamais une
// moyenne globale. Chaque barre = une dimension, hauteur proportionnelle à la
// valeur, valeur au-dessus, libellé court dessous, teinte = identité de la
// dimension. Conformité MDR : couleur = identité seule, hauteur = magnitude brute.

export interface FingerprintBar {
  readonly key: string
  readonly label: string
  /** Valeur brute (ex. moyenne), ou null si non renseignée. */
  readonly value: number | null
  /** Teinte pastel (fill) de la dimension. */
  readonly color: string
}

export interface DimensionFingerprintProps {
  readonly bars: readonly FingerprintBar[]
  /** Borne haute de l'échelle (10 pour mood_tracker). */
  readonly yMax: number
  /** Hauteur de la zone de barres en px (défaut 44). */
  readonly barAreaHeight?: number
  /** Affiche la valeur au-dessus de chaque barre (défaut true). */
  readonly showValues?: boolean
}

const MIN_BAR_RATIO = 0.12

export function DimensionFingerprint({
  bars, yMax, barAreaHeight = 44, showValues = true,
}: DimensionFingerprintProps) {
  const safeMax = yMax > 0 ? yMax : 1
  return (
    <div className="dim-fingerprint">
      {bars.map(bar => {
        const height = bar.value != null && bar.value > 0
          ? Math.max(MIN_BAR_RATIO, Math.min(bar.value / safeMax, 1)) * barAreaHeight
          : 0
        return (
          <div key={bar.key} className="dim-fingerprint__col">
            {showValues ? (
              <span className="dim-fingerprint__value">{bar.value ?? '-'}</span>
            ) : null}
            <span className="dim-fingerprint__track" style={{ height: barAreaHeight }}>
              <span
                className="dim-fingerprint__bar"
                style={{ height, background: bar.color }}
                data-testid={`fingerprint-bar-${bar.key}`}
              />
            </span>
            <span className="dim-fingerprint__label">{bar.label}</span>
          </div>
        )
      })}
    </div>
  )
}
