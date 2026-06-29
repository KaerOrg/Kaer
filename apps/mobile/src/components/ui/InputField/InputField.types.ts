import type { TextInputProps, ViewStyle } from 'react-native'

export interface InputFieldProps extends TextInputProps {
  /** Libellé affiché au-dessus du champ. Optionnel : omis quand le label est rendu
   *  ailleurs (ex. aperçu de module où `FieldRow` porte déjà le libellé). */
  label?: string
  error?: string
  containerStyle?: ViewStyle
}
