import React, { useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'
import { styles } from './Card.styles'
import type { CardProps } from './Card.types'

export const Card = React.memo(function Card({ header, actions, children, variant = 'default', state, style, accentColor, onPress, accessibilityLabel }: CardProps) {
  const accentStyle = useMemo(
    () => accentColor ? { borderColor: accentColor, borderWidth: 2 } : null,
    [accentColor],
  )
  const inner = (
    <>
      {header ? (
        <View style={styles.header}>
          {header.icon ? <Text style={styles.icon}>{header.icon}</Text> : null}
          <View style={styles.titles}>
            <Text style={styles.title}>{header.title}</Text>
            {header.subtitle ? <Text style={styles.subtitle}>{header.subtitle}</Text> : null}
          </View>
        </View>
      ) : null}
      {children}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </>
  )

  if (onPress) {
    return (
      <Pressable
        style={[styles.base, styles[variant], state ? styles[state] : null, accentStyle, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {inner}
      </Pressable>
    )
  }

  return (
    <View style={[styles.base, styles[variant], state ? styles[state] : null, accentStyle, style]}>
      {inner}
    </View>
  )
})
