import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export type ButtonSize = 'sm' | 'md'

export interface ButtonProps {
  /**
   * Libellé du bouton. Optionnel : sans libellé, le bouton est « icône seule »
   * (rendu compact). Fournir alors `accessibilityLabel` et `iconLeft`.
   */
  label?: string
  onPress: () => void
  variant?: ButtonVariant
  /** Taille : `md` (CTA, défaut) ou `sm` (compact, actions inline). */
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  /** Nœud affiché à gauche du label, ou seul contenu en mode icône seule. */
  iconLeft?: ReactNode
  /** accessibilityLabel (obligatoire en mode icône seule, faute de texte). */
  accessibilityLabel?: string
  testID?: string
}
