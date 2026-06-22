// Aperçu d'un curseur SUDS (0–100, pas de 10) — valeur figée mise en avant.
// MDR : affichage brut, couleur = convention temporelle (avant/pic/après), pas
// un codage de gravité clinique.
//
// Pendant web 1-1 du SudsField mobile : grand chiffre externe + RatingSelector
// `numbered` sans en-tête (le label est porté par la carte parente).

import { RatingSelector } from '../../../../ui/RatingSelector'

interface Props {
  value: number
  /** Couleur d'accent (token CSS, ex. var(--color-danger)). */
  color: string
}

const PIPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export function SudsPickerPreview({ value, color }: Props) {
  return (
    <div className="ej-suds-picker">
      <div className="ej-suds-picker__big" style={{ color }}>{value}</div>
      <RatingSelector
        variant="numbered"
        label="SUDS"
        value={value}
        steps={PIPS}
        color={color}
        showHeader={false}
      />
    </div>
  )
}
