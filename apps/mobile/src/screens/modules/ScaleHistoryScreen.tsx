import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { getAllScaleEntries, deleteScaleEntry, type ScaleEntry } from '../../lib/database'
import {
  buildTotalScoreChartData,
  buildXLabels,
  computeAvg,
  type TimeRange,
} from '@ui/Chart/TimeRangeCharts/chartUtils'
import { DimensionChart } from '@ui/Chart/TimeRangeCharts/DimensionChart'
import { formatDateLong } from '../../lib/dateUtils'
import { SCALE_SCORING } from '../../lib/scaleScoring'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '@theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/features/TeenAccent'
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleHistory'>


export default function ScaleHistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id } = params
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const { showConfirm } = useConfirmDialog()
  const accentColor = teenColor(scale_id)

  React.useEffect(() => {
    navigation.setOptions({ title: t(`modules.${scale_id}.label`) })
  }, [scale_id, t, navigation])

  const config = SCALE_SCORING[scale_id]
  const scoreLabel = t(`modules.${scale_id}.score_label`)
  const scoreMax = t(`modules.${scale_id}.score_max`)
  const newBtnLabel = t(`modules.${scale_id}.new_btn`)
  const emptyTitle = t(`modules.${scale_id}.empty_title`)
  const emptyText = t(`modules.${scale_id}.empty_text`)

  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<TimeRange>('1A')

  const chartColor = accentColor ?? colors.primary
  const chartPoints = useMemo(() => buildTotalScoreChartData(entries, range), [entries, range])
  const xLabels = useMemo(() => buildXLabels(range, i18n.language), [range, i18n.language])
  const avgValue = computeAvg(chartPoints)
  const yMax = useMemo(() => {
    const maxEntry = Math.max(...entries.map(e => e.total_score), 10)
    return Math.ceil(maxEntry / 5) * 5
  }, [entries])

  useFocusEffect(
    useCallback(() => {
      let active = true
      getAllScaleEntries(scale_id)
        .then(data => {
          if (active) { setEntries(data); setLoading(false) }
        })
        .catch(() => { if (active) setLoading(false) })
      return () => { active = false }
    }, [scale_id])
  )

  const handleDelete = useCallback((id: string) => {
    showConfirm({
      title: t('common.delete_record_title'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteScaleEntry(id)
        setEntries(prev => prev.filter(e => e.id !== id))
      },
    })
  }, [t, showConfirm])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={typography.h2}>{t(`modules.${scale_id}.label`)}</Text>
        </View>

        <Pressable
          style={[styles.newBtn, isTeenMode && accentColor != null && { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('ScaleEntry', { scale_id })}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.newBtnText}>{newBtnLabel}</Text>
        </Pressable>

        {/* ── Graphe d'évolution ────────────────────────────────── */}
        {entries.length >= 2 && (
          <View style={styles.chartSection}>
            <View style={styles.rangeRow}>
              {(['7J', '1M', '3M', '6M', '1A'] as TimeRange[]).map(r => (
                <Pressable
                  key={r}
                  style={[
                    styles.rangeBtn,
                    range === r && { backgroundColor: chartColor },
                  ]}
                  onPress={() => setRange(r)}
                >
                  <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
            <DimensionChart
              label={t('modules.scale_history.evolution_label')}
              points={chartPoints}
              color={chartColor}
              avgLabel={t('modules.scale_history.avg', { value: avgValue })}
              range={range}
              xLabels={xLabels}
              yMax={yMax}
            />
          </View>
        )}

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map(entry => {
              const displayScore = config?.score_decimals > 0
                ? entry.total_score.toFixed(config.score_decimals)
                : String(Math.round(entry.total_score))
              const entryAccent = isTeenMode && accentColor != null ? accentColor : colors.primary

              return (
                <Pressable
                  key={entry.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('ScaleEntry', { scale_id, entry_id: entry.id })}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.modify')}
                >
                  <View style={styles.cardMain}>
                    <Text style={styles.cardDate}>{formatDateLong(entry.created_at)}</Text>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreLabel}>{scoreLabel}</Text>
                      <Text style={[styles.scoreValue, { color: entryAccent }]}>
                        {displayScore}
                        <Text style={styles.scoreMax}> {scoreMax}</Text>
                      </Text>
                    </View>
                    {/* Chips sous-scores (SNAP-IV, ASRS-18, etc.) */}
                    {config?.chips != null && entry.subscale_scores != null && (
                      <View style={styles.chips}>
                        {config.chips.map(chipKey => {
                          const subscaleKey = chipKeyToSubscaleKey(scale_id, chipKey)
                          const subscaleValue = subscaleKey != null ? entry.subscale_scores![subscaleKey] : undefined
                          if (subscaleValue === undefined) return null
                          return (
                            <View key={chipKey} style={styles.chip}>
                              <Text style={styles.chipKey}>{t(`modules.${scale_id}.${chipKey}`)}</Text>
                              <Text style={styles.chipValue}>{subscaleValue}</Text>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <MaterialCommunityIcons name="pencil-outline" size={17} color={entryAccent} />
                    <Pressable
                      onPress={() => handleDelete(entry.id)}
                      hitSlop={8}
                      accessibilityLabel={t('common.delete')}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}

        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>{t(`modules.${scale_id}.footer`)}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const CHIP_KEY_TO_SUBSCALE: Record<string, Record<string, string>> = {
  snap_iv: { chip_i: 'inattention', chip_hi: 'hyperactivite', chip_tod: 'tod' },
  asrs18:  { chip_a: 'part_a', chip_b: 'part_b' },
  rcads:   { chip_tag: 'tag', chip_tp: 'tp', chip_ts: 'ts', chip_ps: 'ps', chip_toc: 'toc', chip_td: 'td' },
  medication_side_effects: {
    chip_sedation: 'sedation', chip_akathisia: 'akathisia', chip_tremors: 'tremors',
    chip_dry_mouth: 'dry_mouth', chip_sleep: 'sleep', chip_nausea: 'nausea',
  },
  nsi: { chip_pct_recurrent: 'pct_recurrent' },
  mood_tracker: { chip_mood: 'mood', chip_energy: 'energy', chip_anxiety: 'anxiety', chip_pleasure: 'pleasure' },
}

function chipKeyToSubscaleKey(scaleId: string, chipKey: string): string | null {
  return CHIP_KEY_TO_SUBSCALE[scaleId]?.[chipKey] ?? null
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  newBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyTitle: { ...typography.h3, color: colors.textMuted, textAlign: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', maxWidth: 280 },
  list: { gap: spacing.sm },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  cardMain: { flex: 1 },
  cardDate: { ...typography.caption, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 10, paddingLeft: spacing.sm },
  chips: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F4F6', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  chipValue: { fontSize: 11, color: colors.text },
  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.lg,
    padding: spacing.sm, backgroundColor: '#F8FAFC', borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
  chartSection: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  rangeRow: {
    flexDirection: 'row', gap: 4, marginBottom: spacing.sm, justifyContent: 'flex-end',
  },
  rangeBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
  },
  rangeBtnText: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  rangeBtnTextActive: { color: colors.white },
})
