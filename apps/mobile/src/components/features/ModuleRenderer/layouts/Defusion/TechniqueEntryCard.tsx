import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { colors, spacing } from '@theme'
import { useTeen } from '../../../../../hooks/useTeen'
import type { DefusionTechnique } from '@services/defusionService'

export interface TechniqueEntryCardProps {
  technique: DefusionTechnique
  moduleId: string
  accent: string
  /** `primary` = carte dominante (bouton plein) ; `secondary` = carte à chevron. */
  variant: 'primary' | 'secondary'
  onOpen: (technique: DefusionTechnique) => void
}

/**
 * Carte d'entrée d'une technique sur l'accueil. La technique principale (répétition
 * de mot) est dominante : carte `elevated`, accent gauche, seul bouton plein de
 * l'écran (« Commencer »). La secondaire est une carte tappable à chevron.
 */
export function TechniqueEntryCard({
  technique, moduleId, accent, variant, onOpen,
}: TechniqueEntryCardProps) {
  const { isTeenMode } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const mk = useCallback((key: string) => `modules.${moduleId}.${key}`, [moduleId])

  const name = t(mk(`technique_${technique}_name`))
  const desc = t(mk(`technique_${technique}_desc`))
  const handlePress = useCallback(() => onOpen(technique), [onOpen, technique])
  const accentBtnStyle = useMemo(() => ({ backgroundColor: accent }), [accent])
  const primaryCardStyle = useMemo(() => ({ ...styles.primaryCard, borderLeftColor: accent }), [accent])

  if (variant === 'primary') {
    return (
      <Card variant="elevated" style={primaryCardStyle}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.desc}>{desc}</Text>
        <Button
          variant="primary"
          style={accentBtnStyle}
          label={t(mk('start'))}
          onPress={handlePress}
        />
      </Card>
    )
  }

  return (
    <Card variant="outlined" onPress={handlePress} accessibilityLabel={name}>
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.desc}>{desc}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  primaryCard: { borderLeftWidth: 4, gap: spacing.sm },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  secondaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  secondaryText: { flex: 1, flexShrink: 1, gap: 2 },
})
