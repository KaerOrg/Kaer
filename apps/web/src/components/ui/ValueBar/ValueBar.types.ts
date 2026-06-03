export interface ValueBarProps {
  /** Libellé de la dimension (ex. « Humeur »). */
  label: string
  /** Valeur courante affichée et positionnée sur la barre. */
  value: number
  /** Bornes de l'échelle (défaut 1–10). */
  min?: number
  max?: number
  /** Couleur d'accent (pastille, libellé, valeur, remplissage). Défaut : var(--color-primary). */
  color?: string
  /** Repères textuels optionnels aux extrémités (bas / haut). */
  lowHint?: string
  highHint?: string
}
