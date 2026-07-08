import React, { useMemo } from 'react'
import { View, Pressable, Text, ActivityIndicator } from 'react-native'
import { colors } from '@theme'
import { styles } from './Button.styles'
import type { ButtonProps } from './Button.types'

export const Button = React.memo(function Button({ label, sublabel, onPress, variant = 'primary', size = 'md', loading, disabled, style, iconLeft, accessibilityLabel, testID }: ButtonProps) {
  const isDisabled = disabled || loading
  const iconOnly = label == null

  const pressableStyle = useMemo(
    () => [
      styles.base,
      styles[size],
      styles[variant],
      iconOnly ? styles.iconOnly : null,
      isDisabled ? styles.disabled : null,
      iconLeft && !iconOnly ? styles.withIcon : null,
      style,
    ],
    [size, variant, iconOnly, isDisabled, iconLeft, style],
  )

  return (
    <Pressable
      style={pressableStyle}
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
          {label != null ? (
            sublabel != null ? (
              <View style={styles.textColumn}>
                <Text style={[styles.label, size === 'sm' ? styles.labelSm : styles.labelMd, styles[`${variant}Label`]]}>{label}</Text>
                <Text style={[styles.sublabel, styles[`${variant}Label`]]}>{sublabel}</Text>
              </View>
            ) : (
              <Text style={[styles.label, size === 'sm' ? styles.labelSm : styles.labelMd, styles[`${variant}Label`]]}>{label}</Text>
            )
          ) : null}
        </>
      )}
    </Pressable>
  )
})

export default Button
