import React from 'react'
import { Pressable, Text, ActivityIndicator } from 'react-native'
import { colors } from '../../../theme'
import { styles } from './Button.styles'
import type { ButtonProps } from './Button.types'

export const Button = React.memo(function Button({ label, onPress, variant = 'primary', loading, disabled, style, iconLeft, accessibilityLabel, testID }: ButtonProps) {
  const isDisabled = disabled || loading
  const iconOnly = label == null

  return (
    <Pressable
      style={[styles.base, styles[variant], iconOnly ? styles.iconOnly : null, isDisabled ? styles.disabled : null, iconLeft && !iconOnly ? styles.withIcon : null, style]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={iconOnly ? 8 : undefined}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator testID="activity-indicator" color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary} size="small" />
      ) : (
        <>
          {iconLeft}
          {label != null ? <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text> : null}
        </>
      )}
    </Pressable>
  )
})

export default Button
