import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '@theme'
import { getUrgencyItems } from '../../../../../services/crisisPlanService'
import type { PlanItem } from '../../../../../lib/database'

const SECTION_CONFIGS = [
  {
    key: 'step4' as const,
    titleCode: 'modules.crisis_plan.urgency_close_contacts',
    iconName: 'account-group-outline' as const,
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
    bulletColor: '#D97706',
  },
  {
    key: 'step5' as const,
    titleCode: 'modules.crisis_plan.urgency_professionals',
    iconName: 'doctor' as const,
    iconColor: '#7C3AED',
    bgColor: '#EDE9FE',
    bulletColor: '#7C3AED',
  },
]

export function CrisisUrgencyContactsWidget() {
  const { t } = useTranslation()
  const [step4, setStep4] = useState<PlanItem[]>([])
  const [step5, setStep5] = useState<PlanItem[]>([])

  useEffect(() => {
    getUrgencyItems()
      .then(({ step4: s4, step5: s5 }) => { setStep4(s4); setStep5(s5) })
      .catch(() => {})
  }, [])

  const itemsByKey = { step4, step5 }
  const nonEmptySections = SECTION_CONFIGS.filter(c => itemsByKey[c.key].length > 0)

  if (nonEmptySections.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{t('modules.crisis_plan.urgency_no_items')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {nonEmptySections.map(cfg => (
        <View key={cfg.key} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: cfg.bgColor }]}>
              <MaterialCommunityIcons name={cfg.iconName} size={20} color={cfg.iconColor} />
            </View>
            <Text style={styles.cardTitle}>{t(cfg.titleCode)}</Text>
          </View>
          {itemsByKey[cfg.key].map(item => (
            <View key={item.id} style={styles.item}>
              <MaterialCommunityIcons name="circle-small" size={20} color={cfg.bulletColor} />
              <Text style={styles.itemText}>{item.text}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  iconBg:      { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
  item:        { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  itemText:    { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },
  emptyBox:    { padding: spacing.md, alignItems: 'center' },
  emptyText:   { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
})
