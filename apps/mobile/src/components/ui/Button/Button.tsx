import React, { useMemo } from 'react'
import { View, Pressable, Text, ActivityIndicator } from 'react-native'
import { colors } from '@theme'
import { styles } from './Button.styles'
import type { ButtonProps, ButtonVariant } from './Button.types'

// Couleur du spinner `loading` : celle du libellé du variant, pour rester lisible
// sur son fond (le turquoise `primary` porte un libellé sombre depuis la mise en
// conformité AA, un spinner blanc y serait illisible).
const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: colors.text,
  secondary: colors.primary,
  ghost: colors.primary,
  danger: colors.danger,
  ghostDanger: colors.danger,
  dangerSolid: colors.white,
}

export const Button = React.memo(function Button({ label, sublabel, onPress, variant = 'primary', size = 'md', loading, disabled, style, iconLeft, iconRight, accessibilityLabel, testID }: ButtonProps) {
  const isDisabled = disabled || loading
  const iconOnly = label == null

  const pressableStyle = useMemo(
    () => [
      styles.base,
      styles[size],
      styles[variant],
      iconOnly ? styles.iconOnly : null,
      isDisabled ? styles.disabled : null,
      (iconLeft || iconRight) && !iconOnly ? styles.withIcon : null,
      style,
    ],
    [size, variant, iconOnly, isDisabled, iconLeft, iconRight, style],
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
        <ActivityIndicator testID="activity-indicator" color={SPINNER_COLOR[variant]} size="small" />
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
          {!iconOnly ? iconRight : null}
        </>
      )}
    </Pressable>
  )
})

export default Button
