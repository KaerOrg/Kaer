import React, { useCallback, useMemo, useState, type ComponentProps } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import {
  getAllScaleEntries,
  type ScaleEntry,
  type TimelineMarker,
  type MarkerType,
} from '../../../lib/database'
import { deleteScaleEntry } from '@services/scaleEntryService'
import {
  getAllTimelineMarkers,
  saveTimelineMarker,
  deleteTimelineMarker,
} from '@services/timelineMarkerService'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius, typography } from '@theme'
import { useTeen } from '../../../hooks/useTeen'
import { TeenAccent } from '../TeenAccent'
import { useAuthStore } from '../../../store/authStore'
import {
  getAllRoutinesForPatient,
  updateTimeOverride,
  type NotificationRoutine,
} from '@services/notificationService'
import {
  DimensionChart,
  CompositeChart,
  MonthCalendar,
  buildChartData,
  buildCompositeData,
  buildXLabels,
  computeStreak,
  markerXFraction,
} from '@ui/Chart/TimeRangeCharts'
import type { TimeRange, ChartMarker } from '@ui/Chart/TimeRangeCharts'
import { Radio } from '@ui/Radio'
import type { RadioOption } from '@ui/Radio'
import { HistoryCard, type HistoryCardKind } from './HistoryCard'
import { TrackingTab } from './TrackingTab'
import { MarkersCard } from './MarkersCard'
import { MarkerModal } from '../MarkerModal'

type Nav = NativeStackNavigationProp<AppStackParamList>
export type DimensionTrackerTab = 'entry' | 'charts' | 'month' | 'tracking'
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

const DEFAULT_TABS: readonly DimensionTrackerTab[] = ['entry', 'charts', 'month']

function newMarkerId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Configuration d'un module « tracker multi-dimensions » (mood_tracker,
// medication_side_effects…). Pilote l'écran : dimensions suivies, couleurs,
// échelle Y, onglets, repères. MDR : chiffres bruts uniquement, aucune
// interprétation.
export interface DimensionTrackerConfig {
  scaleId: string
  moduleColor: string
  yMax: number
  ranges: readonly TimeRange[]
  dimensionKeys: readonly string[]
  /** Mi-teinte par dimension : courbes, ruban, chips. */
  dimensionColors: Record<string, string>
  /** Teinte pastel (empreinte, curseurs). Défaut : dimensionColors. */
  dimensionFills?: Record<string, string>
  emptyIcon?: IconName
  /** Libellés explicites par clé (effets personnalisés). Sinon i18n dim_<key>. */
  dimensionLabels?: Record<string, string>
  /** Libellés courts (chips) explicites par clé. Sinon i18n chip_<key>. */
  dimensionChipLabels?: Record<string, string>
  /** Navigation vers la saisie (sinon ScaleEntry par défaut). */
  onNewEntry?: () => void
  onEditEntry?: (entryId: string) => void
  /** Active un bouton « Configurer » (modules à effets paramétrables par patient). */
  onConfigure?: () => void
  /** Onglets affichés, dans l'ordre. Défaut ['entry','charts','month']. */
  tabs?: readonly DimensionTrackerTab[]
  /** Rendu de la carte d'historique. Défaut 'score'. */
  historyCardKind?: HistoryCardKind
  /** Affiche la frise de saisonnalité dans l'onglet 'tracking'. */
  showSeasonality?: boolean
  /** Dimension de la saisonnalité (défaut : première clé). */
  seasonDimension?: string
}

export function DimensionTrackerView({ config }: { config: DimensionTrackerConfig }) {
  const { scaleId, moduleColor, yMax, ranges, dimensionKeys, dimensionColors } = config
  const navigation = useNavigation<Nav>()
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(scaleId) ?? moduleColor
  const locale = i18n.language

  const tabs = config.tabs ?? DEFAULT_TABS
  const historyCardKind = config.historyCardKind ?? 'score'
  const fills = config.dimensionFills ?? dimensionColors
  const showSeasonality = config.showSeasonality ?? false
  const seasonDimension = config.seasonDimension ?? dimensionKeys[0] ?? ''

  const goNewEntry = config.onNewEntry ?? (() => navigation.navigate('ScaleEntry', { scale_id: scaleId }))
  const goEditEntry = config.onEditEntry ?? ((id: string) => navigation.navigate('ScaleEntry', { scale_id: scaleId, entry_id: id }))
  const patient = useAuthStore(s => s.patient)

  const [activeTab, setActiveTab] = useState<DimensionTrackerTab>(() => tabs[0] ?? 'entry')
  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const onRangeChange = useCallback((v: string) => {
    const match = ranges.find(r => r === v)
    if (match) setTimeRange(match)
  }, [ranges])
  const [routine, setRoutine] = useState<NotificationRoutine | null>(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [pickerHour, setPickerHour] = useState('08')
  const [pickerMinute, setPickerMinute] = useState('00')

  const [markers, setMarkers] = useState<TimelineMarker[]>([])
  const [showMarkerModal, setShowMarkerModal] = useState(false)

  React.useEffect(() => {
    navigation.setOptions({ title: t(`modules.${scaleId}.label`) })
  }, [t, navigation, scaleId])

  useFocusEffect(
    useCallback(() => {
      let active = true
      const load = async () => {
        const [entriesData, routinesData, markersData] = await Promise.all([
          getAllScaleEntries(scaleId),
          patient?.id ? getAllRoutinesForPatient(patient.id) : Promise.resolve([]),
          getAllTimelineMarkers(scaleId),
        ])
        if (!active) return
        setEntries(entriesData)
        const moduleRoutine = routinesData.find(r => r.module_type === scaleId && !r.patient_paused)
        setRoutine(moduleRoutine ?? null)
        setMarkers(markersData)
        setLoading(false)
      }
      load().catch(() => { if (active) setLoading(false) })
      return () => { active = false }
    }, [patient?.id, scaleId])
  )

  const streak = useMemo(() => computeStreak(entries), [entries])

  const chartData = useMemo(
    () => Object.fromEntries(
      dimensionKeys.map(key => [key, buildChartData(entries, key, timeRange)])
    ) as Record<string, ReturnType<typeof buildChartData>>,
    [entries, timeRange, dimensionKeys]
  )

  const compositePoints = useMemo(
    () => buildCompositeData(entries, dimensionKeys, timeRange),
    [entries, timeRange, dimensionKeys]
  )

  const xLabels = useMemo(() => buildXLabels(timeRange, locale), [timeRange, locale])

  const rangeOptions = useMemo<RadioOption[]>(() => {
    const labels: Record<TimeRange, string> = {
      '7J': t(`modules.${scaleId}.range_7j`),
      '1M': t(`modules.${scaleId}.range_1m`),
      '3M': t(`modules.${scaleId}.range_3m`),
      '6M': t(`modules.${scaleId}.range_3m`),
      '1A': t(`modules.${scaleId}.range_1a`),
    }
    return ranges.map(r => ({ value: r, label: labels[r] ?? r }))
  }, [ranges, t, scaleId])

  // Libellés par dimension mémoïsés (maps stables pour les composants mémoïsés).
  const dimLabelMap = useMemo(
    () => Object.fromEntries(dimensionKeys.map(k =>
      [k, config.dimensionLabels?.[k] ?? t(`modules.${scaleId}.dim_${k}`)])),
    [dimensionKeys, config.dimensionLabels, t, scaleId]
  )
  const chipLabelMap = useMemo(
    () => Object.fromEntries(dimensionKeys.map(k =>
      [k, config.dimensionChipLabels?.[k] ?? t(`modules.${scaleId}.chip_${k}`)])),
    [dimensionKeys, config.dimensionChipLabels, t, scaleId]
  )
  const dimLabel = useCallback((k: string) => dimLabelMap[k] ?? k, [dimLabelMap])

  const ribbonDimensions = useMemo(
    () => dimensionKeys.map(k => ({ key: k, label: dimLabelMap[k] ?? k, color: dimensionColors[k] ?? accentColor })),
    [dimensionKeys, dimLabelMap, dimensionColors, accentColor]
  )

  const markerTypeLabels = useMemo<Record<MarkerType, string>>(() => ({
    treatment: t(`modules.${scaleId}.marker_type_treatment`),
    life_event: t(`modules.${scaleId}.marker_type_life_event`),
    other: t(`modules.${scaleId}.marker_type_other`),
  }), [t, scaleId])

  const trackingLabels = useMemo(() => ({
    ribbonTitle: t(`modules.${scaleId}.ribbon_title`),
    assiduity: (done: number, total: number) => t(`modules.${scaleId}.assiduity`, { done, total }),
    ribbonLegend: t(`modules.${scaleId}.ruban_legend`),
    chartSection: t(`modules.${scaleId}.chart_section`),
    emptyText: t(`modules.${scaleId}.empty_text`),
    seasonTitle: t(`modules.${scaleId}.season_title`),
    seasonHint: t(`modules.${scaleId}.season_hint`),
    seasonCompare: t(`modules.${scaleId}.season_compare`),
  }), [t, scaleId])

  const handleDelete = useCallback((id: string) => {
    Alert.alert(t('common.delete_record_title'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteScaleEntry(id)
          setEntries(prev => prev.filter(e => e.id !== id))
        },
      },
    ])
  }, [t])

  const handleAdjustTime = useCallback(() => {
    if (!routine) return
    const effectiveTime = routine.patient_time_override ?? routine.time_of_day
    const [h, m] = effectiveTime.split(':')
    setPickerHour(h ?? '08')
    setPickerMinute((m ?? '00').slice(0, 2))
    setShowTimePicker(true)
  }, [routine])

  const handleTimePickerConfirm = useCallback(async () => {
    if (!routine || !patient?.id) return
    const hh = pickerHour.padStart(2, '0').slice(0, 2)
    const mm = pickerMinute.padStart(2, '0').slice(0, 2)
    const override = `${hh}:${mm}:00`
    setShowTimePicker(false)
    await updateTimeOverride(routine.id, patient.id, override)
    setRoutine(prev => prev ? { ...prev, patient_time_override: override } : prev)
  }, [routine, patient?.id, pickerHour, pickerMinute])

  const reminderTimeDisplay = useMemo(() => {
    if (!routine) return null
    const t24 = routine.patient_time_override ?? routine.time_of_day
    const [h, m] = t24.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }, [routine, locale])

  const compositeSeriesMemo = useMemo(
    () => dimensionKeys.map(key => ({
      key,
      label: dimLabelMap[key] ?? key,
      color: dimensionColors[key] ?? accentColor,
      points: chartData[key],
    })),
    [chartData, dimLabelMap, accentColor, dimensionKeys, dimensionColors]
  )

  const visibleMarkers = useMemo(() => {
    return markers
      .map(m => ({ marker: m, fraction: markerXFraction(m.date, timeRange) }))
      .filter((x): x is { marker: TimelineMarker; fraction: number } => x.fraction !== null)
      .sort((a, b) => a.marker.date.localeCompare(b.marker.date))
      .map((x, i) => ({ ...x, index: i + 1 }))
  }, [markers, timeRange])

  const chartMarkers: ChartMarker[] = useMemo(
    () => visibleMarkers.map(x => ({ id: x.marker.id, index: x.index, fraction: x.fraction })),
    [visibleMarkers]
  )

  const handleOpenMarkerModal = useCallback(() => setShowMarkerModal(true), [])

  const handleSaveMarker = useCallback(async (input: { label: string; type: MarkerType; date: string }) => {
    const marker: TimelineMarker = {
      id: newMarkerId(),
      scale_id: scaleId,
      date: input.date,
      label: input.label,
      type: input.type,
      created_at: new Date().toISOString(),
    }
    setShowMarkerModal(false)
    await saveTimelineMarker(marker)
    setMarkers(prev => [marker, ...prev])
  }, [scaleId])

  const handleDeleteMarker = useCallback((id: string) => {
    Alert.alert(t('common.delete_record_title'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTimelineMarker(id, scaleId)
          setMarkers(prev => prev.filter(m => m.id !== id))
        },
      },
    ])
  }, [t, scaleId])

  const markersCard = useMemo(() => (
    <MarkersCard
      markers={markers}
      title={t(`modules.${scaleId}.markers_title`)}
      addLabel={t(`modules.${scaleId}.marker_add_title`)}
      emptyLabel={t(`modules.${scaleId}.markers_empty`)}
      allLabel={t('common.all')}
      typeLabels={markerTypeLabels}
      deleteLabel={t('common.delete')}
      locale={locale}
      accentColor={accentColor}
      onAdd={handleOpenMarkerModal}
      onDelete={handleDeleteMarker}
    />
  ), [markers, t, scaleId, markerTypeLabels, locale, accentColor, handleOpenMarkerModal, handleDeleteMarker])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accentColor} size="large" />
      </View>
    )
  }

  const emptyState = (icon: IconName) => (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={icon} size={48} color={colors.border} />
      <Text style={styles.emptyTitle}>{t(`modules.${scaleId}.empty_title`)}</Text>
      <Text style={styles.emptyText}>{t(`modules.${scaleId}.empty_text`)}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && { color: accentColor }]}>
              {t(`modules.${scaleId}.tab_${tab}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container}>

        {/* ── Badge de série (tous onglets) ── */}
        {streak > 0 ? (
          <View style={[styles.streakBadge, { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="fire" size={18} color={accentColor} />
            <Text style={[styles.streakText, { color: accentColor }]}>
              {streak === 1
                ? t(`modules.${scaleId}.streak`, { count: streak })
                : t(`modules.${scaleId}.streak_plural`, { count: streak })}
            </Text>
          </View>
        ) : null}

        {/* ── Onglet SAISIE ── */}
        {activeTab === 'entry' ? (
          <View style={styles.section}>
            {config.onConfigure != null ? (
              <Pressable style={styles.configBtn} onPress={config.onConfigure} accessibilityRole="button">
                <MaterialCommunityIcons name="cog-outline" size={16} color={accentColor} />
                <Text style={[styles.configBtnText, { color: accentColor }]}>
                  {t(`modules.${scaleId}.config_button`)}
                </Text>
              </Pressable>
            ) : null}

            {dimensionKeys.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="cog-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t(`modules.${scaleId}.config_empty_title`)}</Text>
                <Text style={styles.emptyText}>{t(`modules.${scaleId}.config_empty_text`)}</Text>
              </View>
            ) : (
              <>
                <Pressable style={[styles.newBtn, { backgroundColor: accentColor }]} onPress={goNewEntry}>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                  <Text style={styles.newBtnText}>{t(`modules.${scaleId}.new_entry_btn`)}</Text>
                </Pressable>

                {entries.length === 0 ? (
                  emptyState(config.emptyIcon ?? 'emoticon-outline')
                ) : (
                  <View style={styles.list}>
                    {entries.map(entry => (
                      <HistoryCard
                        key={entry.id}
                        entry={entry}
                        kind={historyCardKind}
                        dimensionKeys={dimensionKeys}
                        labels={chipLabelMap}
                        fills={fills}
                        colors={dimensionColors}
                        yMax={yMax}
                        accentColor={accentColor}
                        scoreLabel={t(`modules.${scaleId}.score_label`)}
                        scoreMax={t(`modules.${scaleId}.score_max`)}
                        modifyLabel={t('common.modify')}
                        deleteLabel={t('common.delete')}
                        onEdit={goEditEntry}
                        onDelete={handleDelete}
                      />
                    ))}
                  </View>
                )}

                {/* Section rappel */}
                <View style={styles.reminderSection}>
                  <Text style={styles.reminderTitle}>{t(`modules.${scaleId}.reminder_section`)}</Text>
                  {routine && reminderTimeDisplay ? (
                    <View style={styles.reminderRow}>
                      <MaterialCommunityIcons name="bell-outline" size={18} color={accentColor} />
                      <Text style={[styles.reminderTime, { color: accentColor }]}>
                        {t(`modules.${scaleId}.reminder_active`, { time: reminderTimeDisplay })}
                      </Text>
                      <Pressable onPress={handleAdjustTime} style={styles.reminderBtn}>
                        <Text style={[styles.reminderBtnText, { color: accentColor }]}>
                          {t(`modules.${scaleId}.reminder_adjust`)}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.reminderRow}>
                      <MaterialCommunityIcons name="bell-off-outline" size={18} color={colors.textMuted} />
                      <Text style={styles.reminderNone}>{t(`modules.${scaleId}.reminder_none`)}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* ── Onglet SUIVI (mood_tracker) ── */}
        {activeTab === 'tracking' ? (
          <TrackingTab
            entries={entries}
            dimensionKeys={dimensionKeys}
            dimLabel={dimLabel}
            ribbonDimensions={ribbonDimensions}
            midColors={dimensionColors}
            yMax={yMax}
            accentColor={accentColor}
            locale={locale}
            timeRange={timeRange}
            rangeOptions={rangeOptions}
            onRangeChange={onRangeChange}
            chartData={chartData}
            showSeasonality={showSeasonality}
            seasonDimension={seasonDimension}
            markersSlot={markersCard}
            labels={trackingLabels}
          />
        ) : null}

        {/* ── Onglet GRAPHIQUES (legacy medication) ── */}
        {activeTab === 'charts' ? (
          <View style={styles.section}>
            <Radio options={rangeOptions} value={timeRange} onChange={onRangeChange} variant="pills" color={accentColor} />
            {entries.length === 0 ? (
              emptyState('chart-line')
            ) : (
              <>
                <CompositeChart
                  series={compositeSeriesMemo}
                  avgPoints={compositePoints}
                  xLabels={xLabels}
                  avgLabel={t(`modules.${scaleId}.chart_avg`)}
                  legendLabel={t(`modules.${scaleId}.chart_composite`)}
                  yMax={yMax}
                  markers={chartMarkers}
                />
                {markersCard}
                <Text style={typography.h3}>{t(`modules.${scaleId}.chart_section`)}</Text>
                <View style={styles.chartGrid}>
                  {dimensionKeys.map(key => (
                    <DimensionChart
                      key={key}
                      label={dimLabel(key)}
                      points={chartData[key]}
                      color={dimensionColors[key] ?? accentColor}
                      avgLabel={t(`modules.${scaleId}.chart_avg`)}
                      range={timeRange}
                      xLabels={xLabels}
                      yMax={yMax}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* ── Onglet MOIS (legacy medication) ── */}
        {activeTab === 'month' ? (
          <View style={styles.section}>
            <MonthCalendar
              entries={entries}
              dimensionKeys={dimensionKeys}
              accentColor={accentColor}
              locale={locale}
              daysLabel={t(`modules.${scaleId}.month_days_label`)}
              legendLabel={t(`modules.${scaleId}.month_legend`)}
            />
            {entries.length === 0 ? (
              <Text style={styles.monthEmpty}>{t(`modules.${scaleId}.month_no_entry`)}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Note MDR */}
        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>{t(`modules.${scaleId}.footer`)}</Text>
        </View>

      </ScrollView>

      {/* Modal sélection heure de rappel */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t(`modules.${scaleId}.reminder_adjust`)}</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.timeInput, { borderColor: accentColor }]}
                value={pickerHour}
                onChangeText={v => setPickerHour(v.replace(/\D/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={styles.timeSep}>:</Text>
              <TextInput
                style={[styles.timeInput, { borderColor: accentColor }]}
                value={pickerMinute}
                onChangeText={v => setPickerMinute(v.replace(/\D/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowTimePicker(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={handleTimePickerConfirm} style={[styles.modalConfirmBtn, { backgroundColor: accentColor }]}>
                <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ajout de repère typé */}
      <MarkerModal
        visible={showMarkerModal}
        onClose={() => setShowMarkerModal(false)}
        onSave={handleSaveMarker}
        title={t(`modules.${scaleId}.marker_add_title`)}
        labelPlaceholder={t(`modules.${scaleId}.markers_placeholder`)}
        typeLabels={markerTypeLabels}
        cancelLabel={t('common.cancel')}
        saveLabel={t('common.save')}
        locale={locale}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },

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

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  newBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },

  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  configBtnText: { fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyTitle: { ...typography.h3, color: colors.textMuted, textAlign: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', maxWidth: 280 },

  list: { gap: spacing.sm },

  reminderSection: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  reminderTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reminderTime: { fontSize: 14, fontWeight: '600', flex: 1 },
  reminderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderBtnText: { fontSize: 13, fontWeight: '600' },
  reminderNone: { fontSize: 13, color: colors.textMuted, flex: 1 },

  chartGrid: { gap: spacing.sm },
  monthEmpty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingTop: spacing.md },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    backgroundColor: colors.neutral,
    borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, width: 280, gap: spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeInput: {
    width: 60, height: 52, borderWidth: 2, borderRadius: radius.sm,
    textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.text,
  },
  timeSep: { fontSize: 24, fontWeight: '700', color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, color: colors.white, fontWeight: '600' },
})
