import React from 'react'
import { Text } from 'react-native'
import { Card } from '@ui/Card'
import { styles } from './styles'

export interface AboutBlockProps {
  title: string
  body: string
}

/** Un bloc titré de la fiche « à propos » (#415). Présentation pure. */
export const AboutBlock = React.memo(function AboutBlock({ title, body }: AboutBlockProps) {
  return (
    <Card variant="default">
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockBody}>{body}</Text>
    </Card>
  )
})
