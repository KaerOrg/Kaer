import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native'
import { colors, spacing, radius } from '../theme'

interface InputFieldProps extends TextInputProps {
  label: string
  error?: string
  containerStyle?: ViewStyle
}

export default function InputField({
  label,
  error,
  containerStyle,
  ...props
}: InputFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.focused,
          !!error && styles.inputError,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    minHeight: 50,
  },
  focused: { borderColor: colors.primary, borderWidth: 2 },
  inputError: { borderColor: colors.danger, borderWidth: 1.5 },
  error: { fontSize: 13, color: colors.danger },
})
