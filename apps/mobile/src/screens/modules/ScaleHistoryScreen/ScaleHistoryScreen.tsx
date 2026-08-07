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
import { loadDraft, discardDraft, type ScaleDraft } from '@services/scaleDraftService'
import { fetchModuleFields } from '@services/moduleService'
import { formatDateTime, formatDateLong } from '../../../lib/dateUtils'
import { EntryCard } from './EntryCard'
import { DraftResumeCard } from './DraftResumeCard'
import { LastSubmissionBanner } from './LastSubmissionBanner'
import { ModuleIntroCard } from './ModuleIntroCard'
import { ScoreDisclosure, type ScoreLine } from './ScoreDisclosure'
import { SentEntryRow } from './SentEntryRow'
import { readScoreDisplay } from './historyConfig'
import { homeStyles } from './homeStyles'

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
const INFO_ICON = <MaterialCommunityIcons name="information-outline" size={22} color={colors.text} />

export default function ScaleHistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id } = params
  const { config, accentColor, activeColor, isTeenMode, t, i18n } = useScaleScreen(scale_id)
  const { showConfirm } = useConfirmDialog()

  const handleOpenAbout = useCallback(
    () => navigation.navigate('ScaleAbout', { scale_id }),
    [navigation, scale_id],
  )

  React.useEffect(() => {
    // Bouton d'information de l'en-tête : la porte d'entrée de la fiche « à propos »
    // (#415). Discret, à droite du titre, jamais imposé au patient.
    navigation.setOptions({
      title: t(`modules.${scale_id}.label`),
      headerRight: () => (
        <Button
          variant="ghost"
          onPress={handleOpenAbout}
          accessibilityLabel={t('modules.scale_about.open')}
          iconLeft={INFO_ICON}
          testID="open-scale-about"
        />
      ),
    })
  }, [scale_id, t, navigation, handleOpenAbout])

  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<TimeRange>('1A')
  // Brouillon d'une saisie interrompue (#412). `null` = aucune saisie en cours.
  const [draft, setDraft] = useState<ScaleDraft | null>(null)
  // Posture vis-à-vis du score, lue en base (#408). Jamais un test sur le module.
  const [scoreDisplay, setScoreDisplay] = useState<'inline' | 'collapsed'>('inline')
  const [scoresOpen, setScoresOpen] = useState(false)

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
      // Relu à chaque retour sur l'écran : la saisie qu'on quitte vient peut-être
      // d'en laisser un, ou de le consommer en envoyant la passation.
      loadDraft(scale_id)
        .then(found => { if (active) setDraft(found) })
        .catch(() => { if (active) setDraft(null) })
      // La configuration de l'échelle est en base : une lecture ratée retombe sur le
      // comportement historique plutôt que d'effacer ce que l'écran affichait.
      fetchModuleFields(scale_id)
        .then(result => { if (active) setScoreDisplay(readScoreDisplay(result.fields)) })
        .catch(() => { if (active) setScoreDisplay('inline') })
      return () => { active = false }
    }, [scale_id])
  )

  const handleNew = useCallback(
    () => navigation.navigate('ScaleEntry', { scale_id }),
    [navigation, scale_id],
  )

  const handleResumeDraft = useCallback(
    () => navigation.navigate('ScaleEntry', { scale_id, resume: true }),
    [navigation, scale_id],
  )

  const handleRestartDraft = useCallback(() => {
    // « Recommencer » efface tout, brouillon compris, avant même d'ouvrir la saisie :
    // le patient a demandé à repartir de zéro, il ne doit rien retrouver de l'ancien.
    discardDraft(scale_id)
      .catch(() => {})
      .finally(() => {
        setDraft(null)
        navigation.navigate('ScaleEntry', { scale_id })
      })
  }, [navigation, scale_id])

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

  const collapsed = scoreDisplay === 'collapsed'
  // Le nom du soignant arrive avec QW-4. D'ici là, la convention du projet : jamais de
  // titre en dur (« Dr » est faux pour la majorité des praticiens), et « votre
  // soignant » quand il n'y a pas de nom à insérer.
  const clinician = t('common.your_clinician')

  const introLines = useMemo(
    () => [
      t(`modules.${scale_id}.intro_length`),
      t(`modules.${scale_id}.intro_window`),
      t(`modules.${scale_id}.intro_recipient`, { name: clinician }),
    ],
    [t, scale_id, clinician],
  )

  // Les totaux du dépli : ordre du temps, jamais trié par valeur, aucun écart calculé.
  const scoreLines = useMemo<ScoreLine[]>(
    () => entries.map(entry => ({
      id: entry.id,
      date: formatDateLong(entry.created_at),
      value: (config?.score_decimals ?? 0) > 0
        ? entry.total_score.toFixed(config?.score_decimals ?? 0)
        : String(Math.round(entry.total_score)),
      max: t(`modules.${scale_id}.score_max`),
    })),
    [entries, config, t, scale_id],
  )

  if (loading) return <ScreenLoader />

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={typography.h2}>{t(`modules.${scale_id}.label`)}</Text>
        </View>

        {draft != null ? (
          <DraftResumeCard
            position={draft.position}
            title={t('modules.scale_entry.draft_title', { question: draft.position + 1 })}
            subtitle={t('modules.scale_entry.draft_subtitle', { date: formatDateTime(draft.startedAt) })}
            resumeLabel={t('modules.scale_entry.draft_resume')}
            restartLabel={t('modules.scale_entry.draft_restart')}
            onResume={handleResumeDraft}
            onRestart={handleRestartDraft}
            accentColor={accentColor}
          />
        ) : collapsed ? null : (
          <Button
            label={t(`modules.${scale_id}.new_btn`)}
            onPress={handleNew}
            iconLeft={PLUS_ICON}
            style={newBtnStyle}
          />
        )}

        {/* ── Graphe d'évolution ────────────────────────────────── */}
        {/* Retiré en posture `collapsed` : trois points ne font pas une tendance, et
            une courbe sans axe est un jugement déguisé (#408). */}
        {!collapsed && entries.length >= 2 && (
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

        {collapsed ? (
          entries.length === 0 ? (
            <ModuleIntroCard lines={introLines} />
          ) : (
            <>
              <LastSubmissionBanner
                label={t('modules.scale_history.last_sent_label')}
                date={formatDateLong(entries[0].created_at)}
                // L'accusé de lecture arrive avec QW-2 : jusque-là, la ligne n'existe pas.
                readNotice={null}
              />
              <View style={styles.list}>
                <Text style={homeStyles.sectionLabel}>{t('modules.scale_history.entries_section')}</Text>
                {entries.map(entry => (
                  <SentEntryRow
                    key={entry.id}
                    entryId={entry.id}
                    date={formatDateLong(entry.created_at)}
                    status={t('modules.scale_history.sent_status')}
                    onOpen={handleOpen}
                  />
                ))}
              </View>
              <ScoreDisclosure
                label={t('modules.scale_history.score_details')}
                lines={scoreLines}
                note={t('modules.scale_history.score_note', { name: clinician })}
                open={scoresOpen}
                onToggle={setScoresOpen}
              />
            </>
          )
        ) : entries.length === 0 ? (
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

        {/* Le bouton d'action passe en pied d'écran en posture `collapsed` : la page
            se lit d'abord, on agit ensuite. */}
        {collapsed && draft == null ? (
          <View style={styles.startBlock}>
            <Button
              label={entries.length === 0
                ? t('modules.scale_history.start_btn')
                : t('modules.scale_history.fill_now_btn')}
              onPress={handleNew}
            />
            {entries.length === 0 ? (
              <Text style={homeStyles.startHint}>{t('modules.scale_history.start_hint')}</Text>
            ) : null}
          </View>
        ) : null}

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
  startBlock: { marginTop: spacing.lg },
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
