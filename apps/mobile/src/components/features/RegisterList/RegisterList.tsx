import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card } from '@ui/Card'
import { colors, radius } from '@theme'
import { RegisterRow } from './RegisterRow'
import type { RegisterItem } from './types'

interface RegisterListProps {
  items: RegisterItem[]
}

/**
 * Conteneur « liste-registre » de la grammaire visuelle patient (accueil, agenda,
 * profil) : carte blanche unique, coins arrondis 16, lignes séparées par un filet
 * interne. Chaque ligne = `RegisterRow` (pastille + libellé + chevron). Réutilise
 * `ui/Card` et `ui/IconChip` — aucune duplication du conteneur de section.
 */
export const RegisterList = React.memo(function RegisterList({ items }: RegisterListProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      {items.map((item, index) => (
        <View key={item.key}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <RegisterRow item={item} />
        </View>
      ))}
    </Card>
  )
})

const styles = StyleSheet.create({
  // Carte unique, padding annulé (les lignes gèrent le leur) ; filet interne 1px.
  card: { borderRadius: radius.lg, padding: 0, gap: 0 },
  divider: { height: 1, backgroundColor: colors.neutral },
})
