import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import {
  addExposureSession,
  listExposureItems,
  listSessionsForItem,
  generateId,
  clampSuds,
  type ExposureItem,
  type ExposureSession,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, 'ExposureSession'>

// ─── Slider SUDS (réutilisé) ──────────────────────────────────────────────────

const SLIDER_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const

function SudsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.track}>
        {SLIDER_STEPS.map((step) => (
          <Pressable
            key={step}
            style={sliderStyles.stepWrapper}
            onPress={() => onChange(step)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === step }}
            accessibilityLabel={`${step}`}
            hitSlop={6}
          >
            <View
              style={[
                sliderStyles.step,
                value >= step && sliderStyles.stepFilled,
                value === step && sliderStyles.stepActive,
              ]}
            />
          </Pressable>
        ))}
      </View>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.labelEdge}>0</Text>
        <Text style={sliderStyles.scoreDisplay}>{value}</Text>
        <Text style={sliderStyles.labelEdge}>100</Text>
      </View>
    </View>
  )
}

const sliderStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  step: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  stepFilled: { backgroundColor: colors.primary, opacity: 0.45 },
  stepActive: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, opacity: 1 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelEdge: { fontSize: 12, color: colors.textMuted, minWidth: 24 },
  scoreDisplay: { fontSize: 40, fontWeight: '800', color: colors.primary, textAlign: 'center' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ExposureSessionScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { itemId, hierarchyId } = route.params
  const { isTeenMode, teenColor } = useTeen()

  const [item, setItem] = useState<ExposureItem | null>(null)
  const [pastSessions, setPastSessions] = useState<ExposureSession[]>([])
  const [sudsScore, setSudsScore] = useState(50)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      listExposureItems(hierarchyId),
      listSessionsForItem(itemId),
    ]).then(([items, sessions]) => {
      if (!active) return
      const found = items.find((it) => it.id === itemId) ?? null
      setItem(found)
      setPastSessions(sessions)
      // Pré-remplir avec la dernière valeur si elle existe
      if (sessions.length > 0) {
        setSudsScore(sessions[sessions.length - 1].suds_score)
      } else if (found) {
        setSudsScore(found.suds_score)
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [itemId, hierarchyId])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await addExposureSession(generateId(), itemId, clampSuds(sudsScore))
      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [sudsScore, itemId, navigation, t])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const sessionNumber = pastSessions.length + 1
  const lastSuds = pastSessions.length > 0 ? pastSessions[pastSessions.length - 1].suds_score : null

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('exposure_hierarchy')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero — nom de la situation */}
        <View style={styles.hero}>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>
              {t('modules.exposure_hierarchy.session_number', { n: sessionNumber })}
            </Text>
          </View>
          <Text style={styles.situationTitle} numberOfLines={3}>
            {item?.description ?? ''}
          </Text>
          {lastSuds !== null && (
            <View style={styles.lastSessionRow}>
              <Text style={styles.lastSessionLabel}>
                {t('modules.exposure_hierarchy.last_session_suds')}
              </Text>
              <Text style={styles.lastSessionValue}>{lastSuds}</Text>
            </View>
          )}
        </View>

        {/* Question principale */}
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>
            {isTeenMode
              ? t('modules.exposure_hierarchy.session_question_teen')
              : t('modules.exposure_hierarchy.session_question')}
          </Text>
          <Text style={styles.questionHint}>
            {t('modules.exposure_hierarchy.session_question_hint')}
          </Text>

          <SudsSlider value={sudsScore} onChange={setSudsScore} />
        </View>

        {/* Repères SUDS */}
        <View style={styles.anchors}>
          {[
            { suds: '0–20', label: t('modules.exposure_hierarchy.anchor_0') },
            { suds: '40–60', label: t('modules.exposure_hierarchy.anchor_50') },
            { suds: '80–100', label: t('modules.exposure_hierarchy.anchor_100') },
          ].map((a) => (
            <View key={a.suds} style={styles.anchorRow}>
              <Text style={styles.anchorSuds}>{a.suds}</Text>
              <Text style={styles.anchorLabel}>{a.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>
              {t('modules.exposure_hierarchy.session_save')}
            </Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Hero
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  sessionBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  situationTitle: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 26 },
  lastSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lastSessionLabel: { fontSize: 12, color: colors.textMuted, flex: 1 },
  lastSessionValue: { fontSize: 16, fontWeight: '800', color: colors.primary },

  // Question
  questionSection: {
    gap: spacing.md,
  },
  questionLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  questionHint: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: -spacing.xs },

  // Repères
  anchors: {
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  anchorRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  anchorSuds: { fontSize: 12, fontWeight: '700', color: colors.primary, minWidth: 52 },
  anchorLabel: { fontSize: 12, color: colors.textMuted, flex: 1 },

  // Footer
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
})
