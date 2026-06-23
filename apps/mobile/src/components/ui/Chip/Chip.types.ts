import type { ComponentProps } from 'react'
import type { Ionicons } from '@expo/vector-icons'

export type IoniconName = ComponentProps<typeof Ionicons>['name']

export type ChipSize = 'sm' | 'md'

export interface ChipProps {
  /** Texte de la puce (obligatoire). */
  label: string
  /** Icône Ionicons en tête de puce. */
  icon?: IoniconName
  /** État sélectionné — habille la puce avec `color` (bordure + texte + fond teinté). */
  selected?: boolean
  /**
   * Couleur d'accent appliquée quand `selected`. Défaut : `colors.primary`.
   * Sert aussi de couleur de l'icône à l'état sélectionné.
   */
  color?: string
  /** Taille : `md` par défaut, `sm` pour les puces compactes (aperçus denses). */
  size?: ChipSize
  /** Atténue la puce (opacité réduite) — aperçus inertes, valeurs placeholder. */
  muted?: boolean
  /** Callback au press — rend la puce interactive (`Pressable`). Absent → statique. */
  onPress?: () => void
  testID?: string
}
