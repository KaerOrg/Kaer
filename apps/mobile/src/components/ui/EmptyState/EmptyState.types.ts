import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import type { ButtonVariant } from '../Button/Button.types'

export interface EmptyStateAction {
  label: string
  onPress: () => void
  /** Variante du bouton d'action (défaut `secondary`). */
  variant?: ButtonVariant
  /** Icône affichée à gauche du libellé (ex. `+`). */
  icon?: ReactNode
  testID?: string
}

export interface EmptyStateProps {
  /** Emoji / texte court, OU un nœud d'illustration personnalisé. */
  icon?: string | ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  /** Ligne d'aide affichée sous l'action (nudge). */
  footer?: string
  style?: ViewStyle
  testID?: string
}
