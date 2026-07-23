import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Calendar, Clock } from 'lucide-react-native'
import { Card } from '@ui/Card'
import { Avatar } from '@ui/Avatar'
import { StatusBadge, type StatusBadgeVariant } from '@ui/StatusBadge'
import { colors, spacing, fonts } from '@theme'

interface NextAppointmentCardProps {
  /** Nom du praticien (avatar + titre serif de la carte). */
  name: string
  /** Rôle / titre professionnel du praticien, atténué. Optionnel. */
  role?: string | null
  /** Libellé du statut réel du RDV (Confirmé / En attente…) — jamais une modalité inventée. */
  statusLabel: string
  statusVariant: StatusBadgeVariant
  /** Date longue déjà localisée (ex. « mer. 16 juil. »). */
  dateLabel: string
  /** Heure déjà localisée (ex. « 14:30 »). */
  timeLabel: string
  /** Tap sur la carte : ouvre les actions (reprogrammer / annuler). Optionnel. */
  onPress?: () => void
  /** Libellé d'accessibilité de la carte tappable. */
  accessibilityLabel?: string
}

/**
 * Carte « Prochain rendez-vous » mise en avant : avatar praticien, nom serif, rôle
 * atténué, badge de statut réel à droite ; pied séparé par un filet portant la date et
 * l'heure (icônes turquoise). Assemble les primitives `Card` / `Avatar` / `StatusBadge`.
 */
export const NextAppointmentCard = React.memo(function NextAppointmentCard({
  name, role, statusLabel, statusVariant, dateLabel, timeLabel, onPress, accessibilityLabel,
}: NextAppointmentCardProps) {
  return (
    <Card variant="elevated" onPress={onPress} accessibilityLabel={accessibilityLabel} style={styles.card}>
      <View style={styles.header}>
        <Avatar name={name} />
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {role ? <Text style={styles.role} numberOfLines={1}>{role}</Text> : null}
        </View>
        <StatusBadge variant={statusVariant} label={statusLabel} />
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Calendar size={16} color={colors.primary} />
          <Text style={styles.footerText}>{dateLabel}</Text>
        </View>
        <View style={styles.footerItem}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.footerText}>{timeLabel}</Text>
        </View>
      </View>
    </Card>
  )
})

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  // Le bloc identité se compresse (flexShrink) pour que le badge reste lisible, jamais
  // de débordement latéral.
  identity: { flex: 1, flexShrink: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: fonts.serif },
  role: { fontSize: 14, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.neutral },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footerText: { fontSize: 14, color: colors.text },
})
