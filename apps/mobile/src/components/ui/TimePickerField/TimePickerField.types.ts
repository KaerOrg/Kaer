import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type React from 'react'

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

export interface TimePickerFieldProps {
  /** Heure courante "HH:MM" ('' = non renseignée). */
  value: string
  /** Émis avec la nouvelle heure "HH:MM" (ou '' lors d'un effacement). */
  onChange: (next: string) => void
  /** Libellé au-dessus du bouton. */
  label?: string
  /** Icône du bouton (défaut 'clock-outline'). */
  icon?: MCIName
  /** Texte affiché quand value est vide. */
  placeholder?: string
  /** Libellé du bouton de confirmation iOS (spinner). */
  confirmLabel: string
  /** Indice optionnel sous la valeur (ex. « appuyer pour modifier »). */
  hint?: string
  /** Affiche une croix d'effacement quand une valeur est posée. */
  clearable?: boolean
  /** accessibilityLabel de la croix d'effacement. */
  clearLabel?: string
  /** Couleur d'accent (icône + valeur) quand une valeur est posée. */
  accent?: string
  /** Heure initiale du picker quand value est vide (défaut 9). */
  defaultHour?: number
  /** Minute initiale du picker quand value est vide (défaut 0). */
  defaultMinute?: number
  /** Base de testID : expose `${testID}`, `-button`, `-clear`, `-confirm`. */
  testID?: string
}
