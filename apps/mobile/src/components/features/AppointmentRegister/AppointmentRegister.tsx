import React, { useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Card } from '@ui/Card'
import { colors, spacing, radius, fonts } from '@theme'

export interface AppointmentRegisterItem {
  id: string
  /** Abréviation du jour (ex. « VEN »), déjà localisée. */
  weekday: string
  /** Numéro du jour (ex. « 18 »). */
  dayNumber: string
  /** Titre de la ligne (nom du praticien, ou libellé générique). */
  title: string
  /** Détail atténué (heure · statut). */
  detail: string
  /** Ligne tappable (RDV à venir actionnable) → ouvre les actions. */
  tappable: boolean
}

interface AppointmentRegisterProps {
  items: AppointmentRegisterItem[]
  onSelect: (id: string) => void
}

/**
 * Liste-registre de rendez-vous : un conteneur `Card` unique dont les lignes sont
 * séparées par un filet interne — même grammaire que la liste des modules de l'accueil.
 * Chaque ligne = bloc date (jour abrégé + numéro serif turquoise) + titre + détail.
 */
export const AppointmentRegister = React.memo(function AppointmentRegister({
  items, onSelect,
}: AppointmentRegisterProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      {items.map((item, index) => (
        <View key={item.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <RegisterRow item={item} onSelect={onSelect} />
        </View>
      ))}
    </Card>
  )
})

// Ligne de RDV : SURFACE de liste tappable imbriquée dans une `ui/Card` (cartes
// imbriquées → `ui/Card onPress` inapplicable) — même cas justifié que `ModuleRow`,
// d'où le `Pressable` nu.
const RegisterRow = React.memo(function RegisterRow({
  item,
  onSelect,
}: {
  item: AppointmentRegisterItem
  onSelect: (id: string) => void
}) {
  const handlePress = useCallback(() => onSelect(item.id), [onSelect, item.id])
  return (
    <Pressable
      style={styles.row}
      onPress={item.tappable ? handlePress : undefined}
      disabled={!item.tappable}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.weekday} ${item.dayNumber}`}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.weekday}>{item.weekday}</Text>
        <Text style={styles.dayNumber}>{item.dayNumber}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.detail} numberOfLines={1}>{item.detail}</Text>
      </View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  // Conteneur unique : padding annulé (les lignes gèrent le leur), filets internes.
  card: { borderRadius: radius.lg, padding: 0, gap: 0 },
  divider: { height: 1, backgroundColor: colors.neutral },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateBlock: { width: 44, alignItems: 'center' },
  weekday: { fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 },
  dayNumber: { fontSize: 22, fontWeight: '700', color: colors.primary, fontFamily: fonts.serif },
  // Le bloc texte se compresse pour ne jamais pousser hors écran.
  content: { flex: 1, flexShrink: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, fontFamily: fonts.serif },
  detail: { fontSize: 14, color: colors.textMuted },
})
