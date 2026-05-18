import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '../../theme'
import { getUrgencyItems } from '../../services/crisisPlanService'
import type { PlanItem } from '../../lib/database'

// Numéros d'urgence hard-codés — indépendants du module (toujours disponibles)
const EMERGENCY_NUMBERS = [
  { number: '15', label: 'SAMU', color: '#DC2626' },
  { number: '3114', label: 'Numéro national de prévention du suicide', color: '#7C3AED' },
]

export default function CrisisUrgencyScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [step4, setStep4] = useState<PlanItem[]>([])
  const [step5, setStep5] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUrgencyItems().then(({ step4: s4, step5: s5 }) => {
      setStep4(s4)
      setStep5(s5)
      setLoading(false)
    })
  }, [])

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* En-tête rouge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="alert-circle" size={28} color="#fff" />
            <View>
              <Text style={styles.headerTitle}>{t('modules.crisis_plan.urgency_title')}</Text>
              <Text style={styles.headerSubtitle}>{t('modules.crisis_plan.urgency_subtitle')}</Text>
            </View>
          </View>
          <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.content} edges={['bottom']}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Boutons d'appel d'urgence */}
            <View style={styles.callSection}>
              {EMERGENCY_NUMBERS.map(e => (
                <Pressable
                  key={e.number}
                  style={[styles.callBtn, { backgroundColor: e.color }]}
                  onPress={() => void Linking.openURL(`tel:${e.number}`)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="phone" size={24} color="#fff" />
                  <View>
                    <Text style={styles.callNumber}>{e.number}</Text>
                    <Text style={styles.callLabel}>{e.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Étape 4 — Personnes de confiance */}
            {step4.length > 0 && (
              <View style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <View style={[styles.stepIconBg, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.stepCardTitle}>{t('modules.crisis_plan.urgency_close_contacts')}</Text>
                </View>
                {step4.map(item => (
                  <View key={item.id} style={styles.item}>
                    <MaterialCommunityIcons name="circle-small" size={20} color="#D97706" />
                    <Text style={styles.itemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Étape 5 — Professionnels */}
            {step5.length > 0 && (
              <View style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <View style={[styles.stepIconBg, { backgroundColor: '#EDE9FE' }]}>
                    <MaterialCommunityIcons name="doctor" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.stepCardTitle}>{t('modules.crisis_plan.urgency_professionals')}</Text>
                </View>
                {step5.map(item => (
                  <View key={item.id} style={styles.item}>
                    <MaterialCommunityIcons name="circle-small" size={20} color="#7C3AED" />
                    <Text style={styles.itemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {step4.length === 0 && step5.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{t('modules.crisis_plan.urgency_no_items')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  safe:    { backgroundColor: '#DC2626' },
  content: { flex: 1 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  headerTitle:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },
  closeBtn:      { padding: spacing.xs },

  scroll: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },

  callSection: { gap: spacing.sm },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  callNumber: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26 },
  callLabel:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 16 },

  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  stepIconBg:     { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  stepCardTitle:  { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },

  item:     { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  itemText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },

  emptyBox:  { padding: spacing.md, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
})
