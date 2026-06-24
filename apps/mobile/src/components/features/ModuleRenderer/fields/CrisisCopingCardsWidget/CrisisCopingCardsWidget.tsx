// ─── Widget `crisis_coping_cards_preview` (mobile) : cartes de coping ────────
//
// Affichage lecture seule des cartes de coping configurées par le praticien
// (pensée → réponse), lues depuis Supabase via `fetchPractitionerConfig`.
// Conformité MDR 2017/745 : restitution brute du contenu praticien, zéro
// interprétation.

import { useState, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import { Card } from '@ui/Card'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useAuthStore } from '../../../../../store/authStore'
import { fetchPractitionerConfig } from '../../../../../services/crisisPlanService'
import type { CrisisPlanCopingCard } from '@kaer/shared'

export function CrisisCopingCardsWidget() {
  const t = useModuleTranslation()
  const patient = useAuthStore(s => s.patient)
  const [cards, setCards] = useState<CrisisPlanCopingCard[]>([])

  useFocusEffect(useCallback(() => {
    const patientId = patient?.id
    if (!patientId) return
    let active = true
    fetchPractitionerConfig(patientId)
      .then(cfg => { if (active) setCards(cfg.copingCards) })
      .catch(() => {})
    return () => { active = false }
  }, [patient]))

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="card-text-outline" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{t('modules.crisis_plan.coping_cards_title')}</Text>
      </View>
      {cards.length === 0 ? (
        <Text style={styles.emptyText}>{t('modules.crisis_plan.coping_cards_empty')}</Text>
      ) : (
        <>
          <Text style={styles.sectionSubtitle}>{t('modules.crisis_plan.coping_cards_subtitle')}</Text>
          {cards.map(card => (
            <View key={card.id} style={styles.copingCard}>
              <View style={styles.copingCardRow}>
                <MaterialCommunityIcons name="thought-bubble-outline" size={14} color={colors.textMuted} />
                <Text style={styles.copingCardLabel}>{t('modules.crisis_plan.coping_card_thought')}</Text>
              </View>
              <Text style={styles.copingCardThought}>{card.thought}</Text>
              <View style={[styles.copingCardRow, styles.copingCardRowSpaced]}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={colors.primary} />
                <Text style={styles.copingCardLabel}>{t('modules.crisis_plan.coping_card_response')}</Text>
              </View>
              <Text style={styles.copingCardResponse}>{card.response}</Text>
            </View>
          ))}
        </>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card:            { borderRadius: radius.lg },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle:    { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  emptyText:       { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  copingCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  copingCardRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copingCardRowSpaced: { marginTop: spacing.sm },
  copingCardLabel:     { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  copingCardThought:   { fontSize: 14, color: colors.text, fontStyle: 'italic' },
  copingCardResponse:  { fontSize: 14, color: colors.text, fontWeight: '500' },
})
