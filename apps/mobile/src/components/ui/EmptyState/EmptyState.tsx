import React from 'react'
import { View, Text } from 'react-native'
import Button from '../Button'
import { styles } from './EmptyState.styles'
import type { EmptyStateProps } from './EmptyState.types'

export const EmptyState = React.memo(function EmptyState({ icon, title, description, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <Button label={action.label} onPress={action.onPress} variant="secondary" /> : null}
    </View>
  )
})
