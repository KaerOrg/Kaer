import type { TextInputProps, ViewStyle } from 'react-native'

export interface InputFieldProps extends TextInputProps {
  label: string
  error?: string
  containerStyle?: ViewStyle
}
