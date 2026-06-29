import React, { useState, useCallback } from 'react'
import { View, Text, TextInput } from 'react-native'
import { colors } from '@theme'
import { styles } from './InputField.styles'
import type { InputFieldProps } from './InputField.types'

export const InputField = React.memo(function InputField({ label, error, containerStyle, ...props }: InputFieldProps) {
  const [focused, setFocused] = useState(false)
  const onFocus = useCallback(() => setFocused(true), [])
  const onBlur = useCallback(() => setFocused(false), [])

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, focused ? styles.focused : null, error ? styles.inputError : null]}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
})

export default InputField
