import React, { useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'
import { styles } from './Card.styles'
import type { CardProps } from './Card.types'

export const Card = React.memo(function Card({ header, actions, children, variant = 'default', state, style, accentColor, leftAccentColor, onPress, accessibilityLabel, testID }: CardProps) {
  const accentStyle = useMemo(
    () => accentColor ? { borderColor: accentColor, borderWidth: 2 } : null,
    [accentColor],
  )
  const stripeColor = useMemo(
    () => leftAccentColor ? { backgroundColor: leftAccentColor } : null,
    [leftAccentColor],
  )
  // Filet gauche rendu comme bande absolue (et non `borderLeftWidth`) : une largeur
  // de bordure non uniforme supprime les coins arrondis sur iOS. `overflow: hidden`
  // (via styles.clipped) rogne la bande au rayon de la carte. Incompatible avec une
  // ombre portée (variant `elevated`) — réservé aux bandeaux bordés (crise…).
  const inner = (
    <>
      {stripeColor ? <View pointerEvents="none" style={[styles.leftStripe, stripeColor]} testID="card-left-accent" /> : null}
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

  const containerStyle = [
    styles.base,
    styles[variant],
    state ? styles[state] : null,
    accentStyle,
    stripeColor ? styles.clipped : null,
    style,
  ]

  if (onPress) {
    return (
      <Pressable
        style={containerStyle}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {inner}
      </Pressable>
    )
  }

  return (
    <View style={containerStyle} testID={testID}>
      {inner}
    </View>
  )
})
