import React, { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@ui/Card'
import { Button } from '@ui/Button'
import { colors, spacing, fontSize } from '@theme'

export interface DraftResumeCardProps {
  /** Rang de l'item où la saisie s'est arrêtée, à partir de 0. */
  position: number
  /** Titre déjà formaté, ex. « Vous en étiez à la question 6 ». */
  title: string
  /** Sous-titre déjà formaté, avec la date de début. */
  subtitle: string
  resumeLabel: string
  restartLabel: string
  onResume: () => void
  onRestart: () => void
  accentColor?: string
}

/**
 * Carte de reprise d'une saisie interrompue (#412).
 *
 * Elle ne connaît ni module, ni brouillon, ni service : le rang, les textes et les
 * deux actions lui arrivent en props. C'est l'écran qui possède le brouillon.
 *
 * Conformité MDR : la carte parle de la POSITION dans le questionnaire, jamais des
 * réponses déjà données. Rien de ce qu'elle affiche ne dépend d'une valeur saisie.
 */
export const DraftResumeCard = React.memo(function DraftResumeCard({
  position, title, subtitle, resumeLabel, restartLabel, onResume, onRestart, accentColor,
}: DraftResumeCardProps) {
  const handleResume = useCallback(() => onResume(), [onResume])
  const handleRestart = useCallback(() => onRestart(), [onRestart])

  return (
    <Card variant="default" accentColor={accentColor} style={styles.card} testID="draft-resume-card">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.actions}>
        <Button label={resumeLabel} onPress={handleResume} testID={`draft-resume-${position}`} />
        <Button label={restartLabel} onPress={handleRestart} variant="secondary" />
      </View>
    </Card>
  )
})

const styles = StyleSheet.create({
  card:     { marginBottom: spacing.md, gap: spacing.xs },
  title:    { fontSize: fontSize.h3, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  // Les deux actions se partagent la largeur : « Recommencer » efface une saisie en
  // cours, elle ne doit pas être plus difficile à viser que « Reprendre ».
  actions:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
})
