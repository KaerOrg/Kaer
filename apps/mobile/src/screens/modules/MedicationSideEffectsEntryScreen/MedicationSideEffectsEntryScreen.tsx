import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { getScaleEntryById, generateId } from '../../../lib/database'
import { saveScaleEntry } from '../../../services/scaleEntryService'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius } from '@theme'
import { useTeen } from '../../../hooks/useTeen'
import { TeenAccent } from '../../../components/features/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'MedicationSideEffectsEntry'>

const SCALE_ID = 'medication_side_effects'
const PIPS = Array.from({ length: 11 }, (_, i) => i) // 0..10

export default function MedicationSideEffectsEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { effects, entry_id } = params
  const isEditing = entry_id != null
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(SCALE_ID) ?? '#8B5CF6'
  const isMounted = useRef(true)

  const [values, setValues] = useState<Record<string, number | null>>(
    () => Object.fromEntries(effects.map(e => [e.key, null]))
  )
  // Date de la saisie — modifiable pour rapporter un jour passé (ex. la veille).
  const [entryDate, setEntryDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    navigation.setOptions({ title: t(isEditing ? 'common.modify' : `modules.${SCALE_ID}.new_entry_btn`) })
  }, [isEditing, navigation, t])

  useEffect(() => {
    if (!isEditing || !entry_id) return
    getScaleEntryById(entry_id).then(existing => {
      if (!existing || !isMounted.current) return
      const subs = existing.subscale_scores ?? {}
      setValues(prev => {
        const next = { ...prev }
        for (const e of effects) {
          const v = subs[e.key]
          if (typeof v === 'number') next[e.key] = v
        }
        return next
      })
      setEntryDate(new Date(existing.created_at))
      setLoading(false)
    }).catch(() => { if (isMounted.current) setLoading(false) })
  }, [entry_id, isEditing, effects])

  const setValue = useCallback((key: string, v: number) => {
    setValues(prev => ({ ...prev, [key]: v }))
  }, [])

  const shiftDate = useCallback((days: number) => {
    setEntryDate(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + days)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (next > today) return prev // pas de date future
      return next
    })
  }, [])

  const answeredCount = useMemo(() => effects.filter(e => values[e.key] != null).length, [effects, values])
  const allAnswered = answeredCount === effects.length

  const handleSubmit = useCallback(async () => {
    if (!allAnswered || saving) return
    setSaving(true)
    const subscale: Record<string, number> = {}
    for (const e of effects) subscale[e.key] = values[e.key] ?? 0
    const answers = effects.map(e => values[e.key] ?? 0)
    const total = answers.length > 0
      ? Math.round(answers.reduce((s, v) => s + v, 0) / answers.length)
      : 0
    await saveScaleEntry({
      id: entry_id ?? generateId(),
      scale_id: SCALE_ID,
      answers,
      total_score: total,
      subscale_scores: subscale,
      created_at: entryDate.toISOString(),
    })
    if (isMounted.current) setSaving(false)
    navigation.goBack()
  }, [allAnswered, saving, effects, values, entry_id, navigation, entryDate])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={accentColor} size="large" /></View>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.instruction}>{t(`modules.${SCALE_ID}.instructions`)}</Text>

        {/* Date de la saisie — modifiable pour rapporter un jour passé */}
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>{t(`modules.${SCALE_ID}.entry_date_label`)}</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={() => shiftDate(-1)} style={styles.dateBtn} hitSlop={8} accessibilityLabel={t('common.previous', { defaultValue: '' })}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.dateValue}>
              {entryDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Pressable onPress={() => shiftDate(1)} style={styles.dateBtn} hitSlop={8} accessibilityLabel={t('common.next', { defaultValue: '' })}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {effects.map(effect => {
          const val = values[effect.key]
          const color = effect.color ?? accentColor
          return (
            <View key={effect.key} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.label}>{effect.label}</Text>
                <Text style={[styles.value, { color }]}>{val ?? '–'}</Text>
              </View>
              <View style={styles.pips}>
                {PIPS.map(n => {
                  const selected = val === n
                  const filled = val != null && n <= val
                  return (
                    <Pressable
                      key={n}
                      style={[
                        styles.pip,
                        filled && { backgroundColor: color + '22', borderColor: color },
                        selected && { backgroundColor: color, borderColor: color },
                      ]}
                      onPress={() => setValue(effect.key, n)}
                      accessibilityRole="button"
                      accessibilityLabel={`${effect.label} ${n}`}
                    >
                      <Text style={[styles.pipText, selected && styles.pipTextSelected]}>{n}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <View style={styles.hints}>
                <Text style={styles.hint}>{t(`modules.${SCALE_ID}.dim_hint_low`)}</Text>
                <Text style={styles.hint}>{t(`modules.${SCALE_ID}.dim_hint_high`)}</Text>
              </View>
            </View>
          )
        })}

        <Pressable
          style={[styles.saveBtn, { backgroundColor: allAnswered ? accentColor : colors.border }]}
          onPress={handleSubmit}
          disabled={!allAnswered || saving}
        >
          <Text style={styles.saveBtnText}>
            {allAnswered ? t('common.save') : t(`modules.${SCALE_ID}.progress`, { answered: answeredCount, total: effects.length })}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  instruction: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  dateLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBtn: { padding: 2 },
  dateValue: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  value: { fontSize: 20, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  pips: { flexDirection: 'row', gap: 3 },
  pip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  pipText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  pipTextSelected: { color: colors.white, fontWeight: '700' },
  hints: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontSize: 11, color: colors.textMuted },
  saveBtn: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
