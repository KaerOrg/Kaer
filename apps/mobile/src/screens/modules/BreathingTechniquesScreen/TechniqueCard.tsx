import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Card } from '@ui/Card'
import { colors, spacing, radius } from '@theme'
import { getCycleDuration, type BreathingTechnique } from '@services/breathingService'

export interface TechniqueCardProps {
  technique: BreathingTechnique
  sessionCount: number
  // Reçoit la clé de la technique pour que le parent garde un callback stable
  // (évite la recréation d'une lambda par carte à chaque rendu de la liste).
  onOpen: (techniqueKey: string) => void
}

/** Carte d'une technique de respiration : nom, durée du cycle, description, visualisation des phases. */
export const TechniqueCard = React.memo(function TechniqueCard({
  technique,
  sessionCount,
  onOpen,
}: TechniqueCardProps) {
  const { t } = useTranslation()
  const handlePress = useCallback(() => onOpen(technique.key), [onOpen, technique.key])
  // Bande d'accent colorée à gauche, propre à la technique (ui/Card fournit fond/radius/ombre).
  const accentStyle = useMemo<ViewStyle>(
    () => ({ borderLeftWidth: 4, borderLeftColor: technique.color }),
    [technique.color]
  )

  const cycleDuration = getCycleDuration(technique)
  const name = t(`modules.breathing_techniques.${technique.key}_name`)
  const subtitle = t(`modules.breathing_techniques.${technique.key}_subtitle`)
  const description = t(`modules.breathing_techniques.${technique.key}_description`)
  const evidence = t(`modules.breathing_techniques.${technique.key}_evidence`)

  return (
    <Card variant="elevated" onPress={handlePress} accessibilityLabel={name} style={accentStyle}>
      <View style={styles.cardHeader}>
        <View style={styles.cardText}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.durationBadge, { backgroundColor: technique.color + '1A' }]}>
          <Text style={[styles.durationText, { color: technique.color }]}>
            {cycleDuration}s / cycle
          </Text>
        </View>
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>{description}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.evidenceText}>{evidence}</Text>
        {sessionCount > 0 ? (
          <View style={styles.sessionBadge}>
            <MaterialCommunityIcons name="history" size={12} color={colors.textMuted} />
            <Text style={styles.sessionCount}>
              {t('modules.breathing_techniques.session_count', { count: sessionCount })}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Visualisation des phases */}
      <View style={styles.phases}>
        {technique.phases.map((phase, i) => (
          <View key={i} style={styles.phaseItem}>
            <View style={[styles.phaseBar, { backgroundColor: technique.color, flex: phase.seconds }]} />
            <Text style={styles.phaseLabel}>{phase.seconds}s</Text>
          </View>
        ))}
      </View>
    </Card>
  )
})

const styles = StyleSheet.create({
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardText: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  durationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  durationText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evidenceText: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', flex: 1 },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sessionCount: { fontSize: 11, color: colors.textMuted },

  phases: { flexDirection: 'row', gap: 3, height: 6, marginTop: spacing.xs },
  phaseItem: { flex: 1, gap: 2 },
  phaseBar: { height: 6, borderRadius: radius.full },
  phaseLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
})
