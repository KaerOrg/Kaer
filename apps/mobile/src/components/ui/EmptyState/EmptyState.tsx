import React from 'react'
import { View, Text } from 'react-native'
import Button from '../Button'
import { styles } from './EmptyState.styles'
import type { EmptyStateProps } from './EmptyState.types'

export const EmptyState = React.memo(function EmptyState({ icon, title, description, action, footer, style, testID }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : (icon ?? null)}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'secondary'}
          iconLeft={action.icon}
          testID={action.testID}
        />
      ) : null}
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  )
})
