import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { Card } from '@ui/Card'
import { colors, spacing, fontSize } from '@theme'

export interface ProposedCadenceCardProps {
  /** Intitulé du bloc, ex. « Cadence proposée ». */
  label: string
  /** Cadence déjà formatée, ex. « Toutes les 2 semaines, le mercredi à 19:00 ». */
  cadence: string
  /**
   * Phrase qui rend la proposition non contraignante. Elle n'est pas décorative : une
   * cadence qu'on subit se solde par une désinstallation, pas par de l'observance.
   */
  reassurance: string
}

/**
 * Ce que le praticien PROPOSE, en tête de l'écran de rappels du patient (#413).
 *
 * Le mot compte, et il doit dire la même chose des deux côtés : c'est une cadence
 * **proposée**, jamais imposée. Le patient règle ensuite son propre rappel juste en
 * dessous, et ses réglages remontent au praticien.
 *
 * Conformité MDR 2017/745 : un rappel calendaire est licite parce qu'il est FIXE.
 * Cette carte n'affiche qu'une programmation, jamais une réponse, jamais un score, et
 * rien de ce qu'elle montre ne varie selon ce que le patient a saisi.
 */
export const ProposedCadenceCard = React.memo(function ProposedCadenceCard({
  label, cadence, reassurance,
}: ProposedCadenceCardProps) {
  return (
    <Card variant="default" style={styles.card} testID="proposed-cadence">
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.cadence}>{cadence}</Text>
      <Text style={styles.reassurance}>{reassurance}</Text>
    </Card>
  )
})

const styles = StyleSheet.create({
  card: { gap: spacing.xs, marginBottom: spacing.md },
  label: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  cadence:     { fontSize: fontSize.label, fontWeight: '700', color: colors.text, lineHeight: 22 },
  reassurance: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
})
