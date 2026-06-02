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
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { getAllScaleEntries, deleteScaleEntry, type ScaleEntry } from '../../../lib/database'
import { SCALE_SCORING } from '../../../lib/scaleScoring'
import { formatDateLong } from '../../../lib/dateUtils'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../../theme'
import { useTeen } from '../../../hooks/useTeen'
import { TeenAccent } from '../../../components/features/TeenAccent'
import { useAuthStore } from '../../../store/authStore'
import { useConfirmDialog } from '../../../contexts/ConfirmDialogContext'
import { fetchModuleEvents, type SideEffectsEvent } from '../../../services/homeService'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PillSelector } from '../../../components/ui/PillSelector'
import { buildChartData, buildXLabels, computeStreak } from './chartUtils'
import { SymptomChart } from './SymptomChart'
import type { TimeRange } from './types'
import type { DataPoint } from '../../../components/ui/Chart'

type Nav = NativeStackNavigationProp<AppStackParamList>

const SCALE_ID = 'medication_side_effects'
const MODULE_COLOR = '#8B5CF6'
const TIME_RANGES: TimeRange[] = ['7J', '1M', '6M', '1A']

// Source unique des sous-échelles : la config de scoring (chips). Évite de
// redéclarer la liste des symptômes — elle vit déjà dans scaleScoring.ts.
// Les libellés suivent la convention `effect_<key>_label`.
const SYMPTOM_KEYS = (SCALE_SCORING[SCALE_ID]?.chips ?? []).map(c => c.replace(/^chip_/, ''))

export default function MedicationSideEffectsHistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(SCALE_ID) ?? MODULE_COLOR
  const patient = useAuthStore(s => s.patient)
  const { showConfirm } = useConfirmDialog()

  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [events, setEvents] = useState<SideEffectsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')

  React.useEffect(() => {
    navigation.setOptions({ title: t(`modules.${SCALE_ID}.label`) })
  }, [t, navigation])

  useFocusEffect(
    useCallback(() => {
      let active = true
      const load = async () => {
        const [entriesData, eventsData] = await Promise.all([
          getAllScaleEntries(SCALE_ID),
          patient?.id ? fetchModuleEvents(patient.id, SCALE_ID) : Promise.resolve([]),
        ])
        if (!active) return
        setEntries(entriesData)
        setEvents(eventsData)
        setLoading(false)
      }
      load().catch(() => { if (active) setLoading(false) })
      return () => { active = false }
    }, [patient?.id])
  )

  const locale = i18n.language

  const chartData = useMemo(
    () => Object.fromEntries(
      SYMPTOM_KEYS.map(key => [key, buildChartData(entries, key, timeRange)])
    ) as Record<string, DataPoint[]>,
    [entries, timeRange]
  )

  const xLabels = useMemo(
    () => buildXLabels(timeRange, locale),
    [timeRange, locale]
  )

  const streak = useMemo(() => computeStreak(entries), [entries])

  const rangeLabels: Record<TimeRange, string> = {
    '7J': t(`modules.${SCALE_ID}.range_7j`),
    '1M': t(`modules.${SCALE_ID}.range_1m`),
    '6M': t(`modules.${SCALE_ID}.range_6m`),
    '1A': t(`modules.${SCALE_ID}.range_1a`),
  }
  const avgLabel     = t(`modules.${SCALE_ID}.chart_avg`)
  const chartSection = t(`modules.${SCALE_ID}.chart_section`)
  const scoreLabel   = t(`modules.${SCALE_ID}.score_label`)
  const scoreMax     = t(`modules.${SCALE_ID}.score_max`)
  const newBtnLabel  = t(`modules.${SCALE_ID}.new_btn`)
  const emptyTitle   = t(`modules.${SCALE_ID}.empty_title`)
  const emptyText    = t(`modules.${SCALE_ID}.empty_text`)

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
        <ActivityIndicator color={accentColor} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>

        {streak > 0 && (
          <View style={[styles.streakBadge, { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="fire" size={18} color={accentColor} />
            <Text style={[styles.streakText, { color: accentColor }]}>
              {streak === 1
                ? t(`modules.${SCALE_ID}.streak`, { count: streak })
                : t(`modules.${SCALE_ID}.streak_plural`, { count: streak })}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={typography.h3}>{chartSection}</Text>
          <PillSelector
            options={TIME_RANGES}
            value={timeRange}
            onChange={v => setTimeRange(v as TimeRange)}
            labels={rangeLabels}
            color={accentColor}
          />
          <View style={styles.chartGrid}>
            {SYMPTOM_KEYS.map(key => (
              <SymptomChart
                key={key}
                label={t(`modules.${SCALE_ID}.effect_${key}_label`)}
                points={chartData[key]}
                color={accentColor}
                avgLabel={avgLabel}
                range={timeRange}
                xLabels={xLabels}
              />
            ))}
          </View>
        </View>

        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={typography.h3}>{t(`modules.${SCALE_ID}.events_title`)}</Text>
            <View style={styles.eventsList}>
              {events
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((ev, idx) => (
                  <View key={idx} style={[styles.eventRow, { borderLeftColor: accentColor }]}>
                    <Text style={styles.eventDate}>
                      {new Date(ev.date).toLocaleDateString(locale)}
                    </Text>
                    <Text style={styles.eventLabel}>{ev.label}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <Button
          label={newBtnLabel}
          onPress={() => navigation.navigate('ScaleEntry', { scale_id: SCALE_ID })}
          style={{ backgroundColor: accentColor }}
          iconLeft={<MaterialCommunityIcons name="plus" size={20} color={colors.white} />}
        />

        {entries.length === 0 ? (
          <EmptyState icon="📋" title={emptyTitle} description={emptyText} />
        ) : (
          <View style={styles.list}>
            {entries.map(entry => {
              const notes = entry.subscale_scores?.['notes'] as string | undefined
              return (
                <Card
                  key={entry.id}
                  onPress={() => navigation.navigate('ScaleEntry', { scale_id: SCALE_ID, entry_id: entry.id })}
                  accessibilityLabel={t('common.modify')}
                  actions={
                    <View style={styles.cardActions}>
                      <MaterialCommunityIcons name="pencil-outline" size={17} color={accentColor} />
                      <Pressable
                        onPress={() => handleDelete(entry.id)}
                        hitSlop={8}
                        accessibilityLabel={t('common.delete')}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  }
                >
                  <View style={styles.cardMain}>
                    <Text style={styles.cardDate}>{formatDateLong(entry.created_at)}</Text>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreLabel}>{scoreLabel}</Text>
                      <Text style={[styles.scoreValue, { color: accentColor }]}>
                        {Math.round(entry.total_score)}
                        <Text style={styles.scoreMax}> {scoreMax}</Text>
                      </Text>
                    </View>
                    {entry.subscale_scores != null && (
                      <View style={styles.chips}>
                        {SYMPTOM_KEYS.map(key => {
                          const val = entry.subscale_scores![key] as number | undefined
                          if (val == null) return null
                          return (
                            <View key={key} style={styles.chip}>
                              <Text style={styles.chipKey}>
                                {t(`modules.${SCALE_ID}.chip_${key}`)}
                              </Text>
                              <Text style={styles.chipValue}>{val}</Text>
                            </View>
                          )
                        })}
                      </View>
                    )}
                    {!!notes && (
                      <Text style={styles.noteInline} numberOfLines={2}>{notes}</Text>
                    )}
                  </View>
                </Card>
              )
            })}
          </View>
        )}

        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>{t(`modules.${SCALE_ID}.footer`)}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.sm },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  streakText: { fontWeight: '700', fontSize: 14 },
  chartGrid: { gap: spacing.sm },
  eventsList: { gap: spacing.xs },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    paddingVertical: 4,
  },
  eventDate: { fontSize: 12, fontWeight: '600', color: colors.textMuted, minWidth: 80 },
  eventLabel: { fontSize: 13, color: colors.text, flex: 1 },
  list: { gap: spacing.sm },
  cardMain: { flex: 1 },
  cardDate: { ...typography.caption, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700' },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  chips: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  chipValue: { fontSize: 11, color: colors.text },
  noteInline: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 6 },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 10, paddingLeft: spacing.sm },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
})
