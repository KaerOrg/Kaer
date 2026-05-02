import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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
  addExposureItem,
  updateExposureItem,
  listExposureItems,
  generateId,
  clampSuds,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, 'ExposureHierarchyEntry'>

// ─── Slider SUDS maison ───────────────────────────────────────────────────────
// Curseur horizontal 0-100 implémenté avec des Pressable pour éviter
// la dépendance à @react-native-community/slider

const SLIDER_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const

interface SudsSliderProps {
  value: number
  onChange: (v: number) => void
}

function SudsSlider({ value, onChange }: SudsSliderProps) {
  const { t } = useTranslation()
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
            hitSlop={4}
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
        <Text style={sliderStyles.labelLeft}>
          {t('modules.exposure_hierarchy.suds_low')}
        </Text>
        <Text style={sliderStyles.labelCenter}>{value}</Text>
        <Text style={sliderStyles.labelRight}>
          {t('modules.exposure_hierarchy.suds_high')}
        </Text>
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
    height: 36,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  step: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  stepFilled: { backgroundColor: colors.primary, opacity: 0.5 },
  stepActive: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    opacity: 1,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: { fontSize: 11, color: colors.textMuted },
  labelCenter: { fontSize: 20, fontWeight: '800', color: colors.primary },
  labelRight: { fontSize: 11, color: colors.textMuted },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ExposureHierarchyEntryScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { hierarchyId, itemId } = route.params
  const { isTeenMode, tt, teenColor } = useTeen()

  const [description, setDescription] = useState('')
  const [sudsScore, setSudsScore] = useState(50)
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!itemId)

  const isEdit = !!itemId

  // Chargement des valeurs existantes en mode édition
  useEffect(() => {
    if (!itemId) return
    let active = true
    listExposureItems(hierarchyId).then((items) => {
      if (!active) return
      const existing = items.find((it) => it.id === itemId)
      if (existing) {
        setDescription(existing.description)
        setSudsScore(existing.suds_score)
      }
      setLoadingEdit(false)
    })
    return () => { active = false }
  }, [itemId, hierarchyId])

  const handleSudsChange = useCallback((v: number) => {
    setSudsScore(clampSuds(v))
  }, [])

  const handleSave = useCallback(async () => {
    const trimmed = description.trim()
    if (!trimmed) {
      Alert.alert(
        t('common.error'),
        t('modules.exposure_hierarchy.description_required')
      )
      return
    }

    setSaving(true)
    try {
      if (isEdit && itemId) {
        await updateExposureItem(itemId, trimmed, sudsScore)
      } else {
        await addExposureItem(generateId(), hierarchyId, trimmed, sudsScore)
      }
      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [description, sudsScore, isEdit, itemId, hierarchyId, navigation, t])

  if (loadingEdit) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('exposure_hierarchy')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>
            {tt('exposure_hierarchy', 'description_label')}
          </Text>
          <Text style={styles.hint}>
            {tt('exposure_hierarchy', 'description_hint')}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('modules.exposure_hierarchy.description_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
            autoFocus={!isEdit}
          />
        </View>

        {/* Score SUDS */}
        <View style={styles.field}>
          <Text style={styles.label}>
            {t('modules.exposure_hierarchy.suds_label')}
          </Text>
          <Text style={styles.hint}>
            {tt('exposure_hierarchy', 'suds_hint')}
          </Text>
          <SudsSlider value={sudsScore} onChange={handleSudsChange} />
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
              {isEdit ? t('common.save') : t('modules.exposure_hierarchy.add_item')}
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

  field: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },

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
    paddingVertical: spacing.sm + 2,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
