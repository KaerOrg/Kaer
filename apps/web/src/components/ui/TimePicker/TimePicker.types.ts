import type { ReactNode } from 'react'

export interface TimePickerProps {
  /** Libellé au-dessus du champ. */
  label?: string
  /** Heure contrôlée « HH:MM » (`''` = vide). Laisser indéfini pour le mode non contrôlé. */
  value?: string
  /** Heure initiale en mode non contrôlé (avec `ref` lu au submit). */
  defaultValue?: string
  /** Émis avec la nouvelle heure « HH:MM » (ou `''` à l'effacement). */
  onChange?: (next: string) => void
  /** Icône à gauche (défaut : horloge). */
  icon?: ReactNode
  /** Affiche une croix d'effacement quand une valeur est posée. */
  clearable?: boolean
  /** accessibilityLabel de la croix d'effacement. */
  clearLabel?: string
  /** Couleur d'accent (icône) quand une valeur est posée. Défaut : var(--color-primary). */
  accent?: string
  /** Indice optionnel sous le champ. */
  hint?: string
  /** Pas de la saisie en secondes (natif `<input type="time" step>`). */
  step?: number
  /** Aperçu en lecture seule (ex. widget de preview module). */
  disabled?: boolean
  id?: string
  className?: string
  'data-testid'?: string
}
