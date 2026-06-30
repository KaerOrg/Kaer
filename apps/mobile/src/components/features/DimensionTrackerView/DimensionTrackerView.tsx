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
  deleteScaleEntry,
  getAllTimelineMarkers,
  saveTimelineMarker,
  deleteTimelineMarker,
  type ScaleEntry,
  type TimelineMarker,
} from '../../../lib/database'
import { formatDateLong } from '../../../lib/dateUtils'
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

type Nav = NativeStackNavigationProp<AppStackParamList>
type Tab = 'entry' | 'charts' | 'month'
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

// Configuration d'un module « tracker multi-dimensions » (mood_tracker,
// medication_side_effects…). Pilote intégralement l'écran : dimensions suivies,
// couleurs, échelle Y, repères temporels (cloisonnés par scaleId). MDR : affichage
// de chiffres bruts uniquement, aucune interprétation.
export interface DimensionTrackerConfig {
  scaleId: string
  moduleColor: string
  yMax: number
  ranges: readonly TimeRange[]
  dimensionKeys: readonly string[]
  dimensionColors: Record<string, string>
  emptyIcon?: IconName
  /** Libellés explicites par clé (effets personnalisés). Sinon résolus via i18n dim_<key>. */
  dimensionLabels?: Record<string, string>
  /** Libellés courts (chips) explicites par clé. Sinon résolus via i18n chip_<key>. */
  dimensionChipLabels?: Record<string, string>
  /** Navigation vers la saisie (sinon ScaleEntry par défaut). */
  onNewEntry?: () => void
  onEditEntry?: (entryId: string) => void
  /** Active un bouton « Configurer » (modules à effets paramétrables par patient). */
  onConfigure?: () => void
}

export function DimensionTrackerView({ config }: { config: DimensionTrackerConfig }) {
  const { scaleId, moduleColor, yMax, ranges, dimensionKeys, dimensionColors } = config
  const navigation = useNavigation<Nav>()
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(scaleId) ?? moduleColor

  const dimLabel = (key: string): string =>
    config.dimensionLabels?.[key] ?? t(`modules.${scaleId}.dim_${key}`)
  const chipLabel = (key: string): string =>
    config.dimensionChipLabels?.[key] ?? t(`modules.${scaleId}.chip_${key}`)
  const goNewEntry = config.onNewEntry ?? (() => navigation.navigate('ScaleEntry', { scale_id: scaleId }))
  const goEditEntry = config.onEditEntry ?? ((id: string) => navigation.navigate('ScaleEntry', { scale_id: scaleId, entry_id: id }))
  const patient = useAuthStore(s => s.patient)

  const [activeTab, setActiveTab] = useState<Tab>('entry')
  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  // Radio renvoie un string : on re-narrow vers TimeRange via les ranges
  // configurées (sans cast `as`, interdit par les standards de code).
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
  const [markerLabel, setMarkerLabel] = useState('')
  const [markerDate, setMarkerDate] = useState<Date>(new Date())

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

  const locale = i18n.language
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
      '6M': t(`modules.${scaleId}.range_3m`), // fallback unused
      '1A': t(`modules.${scaleId}.range_1a`),
    }
    return ranges.map(r => ({ value: r, label: labels[r] ?? r }))
  }, [ranges, t, scaleId])

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('common.delete_record_title'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteScaleEntry(id)
            setEntries(prev => prev.filter(e => e.id !== id))
          },
        },
      ]
    )
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
      label: config.dimensionLabels?.[key] ?? t(`modules.${scaleId}.dim_${key}`),
      color: dimensionColors[key] ?? accentColor,
      points: chartData[key],
    })),
    [chartData, t, accentColor, dimensionKeys, dimensionColors, scaleId, config.dimensionLabels]
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

  const handleOpenMarkerModal = useCallback(() => {
    setMarkerLabel('')
    setMarkerDate(new Date())
    setShowMarkerModal(true)
  }, [])

  const shiftMarkerDate = useCallback((days: number) => {
    setMarkerDate(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + days)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (next > today) return prev
      return next
    })
  }, [])

  const handleSaveMarker = useCallback(async () => {
    const label = markerLabel.trim()
    if (label.length === 0) return
    const dateStr = markerDate.toISOString().slice(0, 10)
    const marker: TimelineMarker = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      scale_id: scaleId,
      date: dateStr,
      label,
      created_at: new Date().toISOString(),
    }
    setShowMarkerModal(false)
    await saveTimelineMarker(marker)
    setMarkers(prev => [marker, ...prev])
  }, [markerLabel, markerDate, scaleId])

  const handleDeleteMarker = useCallback((id: string) => {
    Alert.alert(
      t('common.delete_record_title'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTimelineMarker(id)
            setMarkers(prev => prev.filter(m => m.id !== id))
          },
        },
      ]
    )
  }, [t])

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

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {(['entry', 'charts', 'month'] as Tab[]).map(tab => (
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

        {/* ── Streak badge (tous onglets) ── */}
        {streak > 0 && (
          <View style={[styles.streakBadge, { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="fire" size={18} color={accentColor} />
            <Text style={[styles.streakText, { color: accentColor }]}>
              {streak === 1
                ? t(`modules.${scaleId}.streak`, { count: streak })
                : t(`modules.${scaleId}.streak_plural`, { count: streak })}
            </Text>
          </View>
        )}

        {/* ── Onglet SAISIE ── */}
        {activeTab === 'entry' && (
          <View style={styles.section}>
            {config.onConfigure != null && (
              <Pressable style={styles.configBtn} onPress={config.onConfigure} accessibilityRole="button">
                <MaterialCommunityIcons name="cog-outline" size={16} color={accentColor} />
                <Text style={[styles.configBtnText, { color: accentColor }]}>
                  {t(`modules.${scaleId}.config_button`)}
                </Text>
              </Pressable>
            )}

            {dimensionKeys.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="cog-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t(`modules.${scaleId}.config_empty_title`)}</Text>
                <Text style={styles.emptyText}>{t(`modules.${scaleId}.config_empty_text`)}</Text>
              </View>
            ) : (
            <>
            <Pressable
              style={[styles.newBtn, { backgroundColor: accentColor }]}
              onPress={goNewEntry}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.newBtnText}>
                {t(`modules.${scaleId}.new_entry_btn`)}
              </Text>
            </Pressable>

            {entries.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name={config.emptyIcon ?? 'emoticon-outline'} size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t(`modules.${scaleId}.empty_title`)}</Text>
                <Text style={styles.emptyText}>{t(`modules.${scaleId}.empty_text`)}</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {entries.map(entry => {
                  const subs = entry.subscale_scores
                  return (
                    <Pressable
                      key={entry.id}
                      style={styles.card}
                      onPress={() => goEditEntry(entry.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.modify')}
                    >
                      <View style={styles.cardMain}>
                        <Text style={styles.cardDate}>{formatDateLong(entry.created_at)}</Text>
                        <View style={styles.scoreRow}>
                          <Text style={styles.scoreLabel}>{t(`modules.${scaleId}.score_label`)}</Text>
                          <Text style={[styles.scoreValue, { color: accentColor }]}>
                            {Math.round(entry.total_score)}
                            <Text style={styles.scoreMax}> {t(`modules.${scaleId}.score_max`)}</Text>
                          </Text>
                        </View>
                        {subs != null && (
                          <View style={styles.chips}>
                            {dimensionKeys.map(key => {
                              const val = subs[key] as number | undefined
                              if (val == null) return null
                              return (
                                <View key={key} style={styles.chip}>
                                  <View style={[styles.chipDot, { backgroundColor: dimensionColors[key] }]} />
                                  <Text style={styles.chipKey}>
                                    {chipLabel(key)}
                                  </Text>
                                  <Text style={styles.chipValue}>{val}</Text>
                                </View>
                              )
                            })}
                          </View>
                        )}
                      </View>
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
                    </Pressable>
                  )
                })}
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

            {/* Modal sélection heure */}
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
            </>
            )}
          </View>
        )}

        {/* ── Onglet GRAPHIQUES ── */}
        {activeTab === 'charts' && (
          <View style={styles.section}>
            <Radio
              options={rangeOptions}
              value={timeRange}
              onChange={onRangeChange}
              variant="pills"
              color={accentColor}
            />

            {entries.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="chart-line" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t(`modules.${scaleId}.empty_title`)}</Text>
                <Text style={styles.emptyText}>{t(`modules.${scaleId}.empty_text`)}</Text>
              </View>
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

                {/* Repères temporels (Life Chart) */}
                <View style={styles.markersCard}>
                  <View style={styles.markersHeader}>
                    <Text style={styles.markersTitle}>
                      {t(`modules.${scaleId}.markers_title`)}
                    </Text>
                    <Pressable
                      onPress={handleOpenMarkerModal}
                      style={[styles.markerAddBtn, { borderColor: accentColor }]}
                      hitSlop={6}
                    >
                      <MaterialCommunityIcons name="plus" size={14} color={accentColor} />
                      <Text style={[styles.markerAddText, { color: accentColor }]}>
                        {t(`modules.${scaleId}.markers_add`)}
                      </Text>
                    </Pressable>
                  </View>

                  {visibleMarkers.length === 0 ? (
                    <Text style={styles.markersEmpty}>
                      {t(`modules.${scaleId}.markers_empty`)}
                    </Text>
                  ) : (
                    <View style={styles.markersList}>
                      {visibleMarkers.map(({ marker, index }) => (
                        <View key={marker.id} style={styles.markerRow}>
                          <View style={styles.markerBadge}>
                            <Text style={styles.markerBadgeText}>{index}</Text>
                          </View>
                          <View style={styles.markerInfo}>
                            <Text style={styles.markerDate}>
                              {new Date(marker.date + 'T12:00:00').toLocaleDateString(locale, {
                                day: 'numeric', month: 'short',
                              })}
                            </Text>
                            <Text style={styles.markerLabelText} numberOfLines={1}>
                              {marker.label}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteMarker(marker.id)}
                            hitSlop={8}
                            accessibilityLabel={t('common.delete')}
                          >
                            <MaterialCommunityIcons
                              name="trash-can-outline" size={16} color={colors.textMuted}
                            />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Graphiques par dimension */}
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
        )}

        {/* ── Onglet MOIS ── */}
        {activeTab === 'month' && (
          <View style={styles.section}>
            <MonthCalendar
              entries={entries}
              dimensionKeys={dimensionKeys}
              accentColor={accentColor}
              locale={locale}
              daysLabel={t(`modules.${scaleId}.month_days_label`)}
              legendLabel={t(`modules.${scaleId}.month_legend`)}
            />
            {entries.length === 0 && (
              <Text style={styles.monthEmpty}>{t(`modules.${scaleId}.month_no_entry`)}</Text>
            )}
          </View>
        )}

        {/* Note MDR */}
        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>{t(`modules.${scaleId}.footer`)}</Text>
        </View>

      </ScrollView>

      {/* Modal ajout de repère */}
      <Modal visible={showMarkerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.markerModalBox}>
            <Text style={styles.modalTitle}>{t(`modules.${scaleId}.markers_add`)}</Text>

            <TextInput
              style={styles.markerInput}
              value={markerLabel}
              onChangeText={setMarkerLabel}
              placeholder={t(`modules.${scaleId}.markers_placeholder`)}
              placeholderTextColor={colors.textMuted}
              maxLength={60}
              autoFocus
            />

            <View style={styles.markerDateRow}>
              <Pressable onPress={() => shiftMarkerDate(-1)} style={styles.markerDateBtn} hitSlop={8}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
              </Pressable>
              <Text style={styles.markerDateLabel}>
                {markerDate.toLocaleDateString(locale, {
                  weekday: 'short', day: 'numeric', month: 'long',
                })}
              </Text>
              <Pressable onPress={() => shiftMarkerDate(1)} style={styles.markerDateBtn} hitSlop={8}>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowMarkerModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveMarker}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: markerLabel.trim() ? accentColor : colors.border },
                ]}
                disabled={!markerLabel.trim()}
              >
                <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },

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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
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
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  chipValue: { fontSize: 11, color: colors.text },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 10, paddingLeft: spacing.sm },

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
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: 280,
    gap: spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeInput: {
    width: 60,
    height: 52,
    borderWidth: 2,
    borderRadius: radius.sm,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  timeSep: { fontSize: 24, fontWeight: '700', color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, color: colors.white, fontWeight: '600' },

  // ── Repères temporels ──
  markersCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  markersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markersTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  markerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  markerAddText: { fontSize: 12, fontWeight: '600' },
  markersEmpty: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  markersList: { gap: 6 },
  markerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  markerInfo: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  markerDate: { fontSize: 12, fontWeight: '700', color: colors.textMuted, minWidth: 56 },
  markerLabelText: { fontSize: 13, color: colors.text, flex: 1 },

  markerModalBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: 300,
    gap: spacing.md,
  },
  markerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  markerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  markerDateBtn: { padding: 2 },
  markerDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
  },
})
