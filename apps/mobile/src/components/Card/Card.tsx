import React from 'react'
import { View, Text } from 'react-native'
import { styles } from './Card.styles'
import type { CardProps } from './Card.types'

export const Card = React.memo(function Card({ header, actions, children, variant = 'default', state, style }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], state ? styles[state] : null, style]}>
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
    </View>
  )
})
