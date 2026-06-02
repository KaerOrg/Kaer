import React from 'react'
import { Pressable, Text, ActivityIndicator } from 'react-native'
import { colors } from '../../../theme'
import { styles } from './Button.styles'
import type { ButtonProps } from './Button.types'

export const Button = React.memo(function Button({ label, onPress, variant = 'primary', loading, disabled, style, iconLeft }: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      style={[styles.base, styles[variant], isDisabled ? styles.disabled : null, iconLeft ? styles.withIcon : null, style]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator testID="activity-indicator" color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary} size="small" />
      ) : (
        <>
          {iconLeft}
          <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
        </>
      )}
    </Pressable>
  )
})

export default Button
