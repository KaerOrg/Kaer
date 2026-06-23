import type { ViewStyle } from 'react-native'

/** Une option d'un `SegmentedControl` : la valeur sélectionnable + son libellé affiché. */
export interface SegmentOption<T extends string = string> {
  value: T
  label: string
}

/**
 * `track` — piste segmentée (conteneur unique teinté, segments à l'intérieur).
 * `pills` — pastilles indépendantes côte à côte.
 */
export type SegmentedControlVariant = 'track' | 'pills'

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentOption<T>[]
  /** Valeur actuellement sélectionnée. */
  value: T
  onChange: (value: T) => void
  variant?: SegmentedControlVariant
  /** Couleur d'accent du segment actif. Défaut : `colors.primary`. */
  accentColor?: string
  /** Libellé accessible du groupe. */
  accessibilityLabel?: string
  /** Style additionnel du conteneur (ex. `justifyContent`, marges). */
  style?: ViewStyle
  testID?: string
}
