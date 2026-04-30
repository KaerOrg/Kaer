import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '../../theme'

const SENSE_STEPS = [
  { count: 5, sense: 'step_see_sense',   icon: 'eye-outline' as const,               color: '#7C3AED' },
  { count: 4, sense: 'step_touch_sense', icon: 'hand-back-left-outline' as const,    color: '#2563EB' },
  { count: 3, sense: 'step_hear_sense',  icon: 'ear-hearing' as const,               color: '#059669' },
  { count: 2, sense: 'step_smell_sense', icon: 'flower-tulip-outline' as const,      color: '#D97706' },
  { count: 1, sense: 'step_taste_sense', icon: 'tongue' as const,                    color: '#DC2626' },
]

export default function GroundingLearnScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Ce que c'est */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.grounding.learn_what_title')}</Text>
          <Text style={styles.paragraph}>{t('modules.grounding.learn_what_p1')}</Text>
          <Text style={styles.paragraph}>{t('modules.grounding.learn_what_p2')}</Text>
        </View>

        {/* Les 5 étapes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.grounding.steps_section')}</Text>
          <View style={styles.stepsCard}>
            {SENSE_STEPS.map((s) => (
              <View key={s.count} style={styles.stepRow}>
                <View style={[styles.stepBadge, { backgroundColor: s.color + '1A' }]}>
                  <Text style={[styles.stepCount, { color: s.color }]}>{s.count}</Text>
                </View>
                <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
                <Text style={styles.stepLabel}>{t(`modules.grounding.${s.sense}`)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quand l'utiliser */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.grounding.learn_when_title')}</Text>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{t(`modules.grounding.learn_when_${i}`)}</Text>
            </View>
          ))}
        </View>

        {/* Pourquoi ça marche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.grounding.learn_why_title')}</Text>
          <Text style={styles.paragraph}>{t('modules.grounding.learn_why_p1')}</Text>
          <Text style={styles.paragraph}>{t('modules.grounding.learn_why_p2')}</Text>
        </View>

        {/* Comment progresser */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.grounding.learn_practice_title')}</Text>
          <Text style={styles.paragraph}>{t('modules.grounding.learn_practice_p1')}</Text>
        </View>

        {/* Référence */}
        <View style={styles.refCard}>
          <MaterialCommunityIcons name="information-outline" size={15} color={colors.textMuted} />
          <Text style={styles.refText}>{t('modules.grounding.learn_ref')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },

  stepsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: { fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },

  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bullet: { fontSize: 15, color: colors.primary, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },

  refCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xs,
  },
  refText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },
})
