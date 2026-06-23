import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { getAllScaleEntries, deleteScaleEntry, type ScaleEntry } from '../../../lib/database'
import {
  buildTotalScoreChartData,
  buildXLabels,
  computeAvg,
  type TimeRange,
} from '@ui/Chart/TimeRangeCharts/chartUtils'
import { DimensionChart } from '@ui/Chart/TimeRangeCharts/DimensionChart'
import { Button } from '@ui/Button'
import { ScreenLoader } from '@ui/ScreenLoader'
import { SegmentedControl, type SegmentOption } from '@ui/SegmentedControl'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius, typography } from '@theme'
import { TeenAccent } from '../../../components/features/TeenAccent'
import { useConfirmDialog } from '../../../contexts/ConfirmDialogContext'
import { useScaleScreen } from '../../../hooks/useScaleScreen'
import { EntryCard } from './EntryCard'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleHistory'>

const RANGE_OPTIONS: readonly SegmentOption<TimeRange>[] = [
  { value: '7J', label: '7J' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1A', label: '1A' },
]

const PLUS_ICON = <MaterialCommunityIcons name="plus" size={20} color={colors.white} />

export default function ScaleHistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id } = params
  const { config, accentColor, activeColor, isTeenMode, t, i18n } = useScaleScreen(scale_id)
  const { showConfirm } = useConfirmDialog()

  React.useEffect(() => {
    navigation.setOptions({ title: t(`modules.${scale_id}.label`) })
  }, [scale_id, t, navigation])

  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<TimeRange>('1A')

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

  const handleNew = useCallback(
    () => navigation.navigate('ScaleEntry', { scale_id }),
    [navigation, scale_id],
  )

  const handleOpen = useCallback(
    (entryId: string) => navigation.navigate('ScaleEntry', { scale_id, entry_id: entryId }),
    [navigation, scale_id],
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

  const newBtnStyle = useMemo<ViewStyle>(
    () => (isTeenMode && accentColor != null
      ? { marginBottom: spacing.lg, backgroundColor: accentColor }
      : { marginBottom: spacing.lg }),
    [isTeenMode, accentColor],
  )

  if (loading) return <ScreenLoader />

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={typography.h2}>{t(`modules.${scale_id}.label`)}</Text>
        </View>

        <Button
          label={t(`modules.${scale_id}.new_btn`)}
          onPress={handleNew}
          iconLeft={PLUS_ICON}
          style={newBtnStyle}
        />

        {/* ── Graphe d'évolution ────────────────────────────────── */}
        {entries.length >= 2 && (
          <View style={styles.chartSection}>
            <SegmentedControl
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              accentColor={activeColor}
              style={styles.rangeRow}
              accessibilityLabel={t('modules.scale_history.evolution_label')}
            />
            <DimensionChart
              label={t('modules.scale_history.evolution_label')}
              points={chartPoints}
              color={activeColor}
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
            <Text style={styles.emptyTitle}>{t(`modules.${scale_id}.empty_title`)}</Text>
            <Text style={styles.emptyText}>{t(`modules.${scale_id}.empty_text`)}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                scaleId={scale_id}
                config={config}
                accentColor={accentColor}
                isTeenMode={isTeenMode}
                t={t}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyTitle: { ...typography.h3, color: colors.textMuted, textAlign: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', maxWidth: 280 },
  list: { gap: spacing.sm },
  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.lg,
    padding: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
  chartSection: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  rangeRow: { alignSelf: 'flex-end', marginBottom: spacing.sm },
})
