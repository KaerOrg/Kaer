import { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, ScrollView, Modal } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { ScreenLoader } from '@ui/ScreenLoader'
import { EmptyState } from '@ui/EmptyState'
import { colors } from '@theme'
import {
  fetchBreathingSessions,
  fetchBreathingSettings,
  saveBreathingSettings,
  techniquesFromFields,
  breathingConfigFromFields,
  resolveActivation,
  type BreathingSession,
  type BreathingSettings,
  type BreathingTechnique,
} from '@services/breathingService'
import type { ContentField } from '@services/moduleService'
import { reportFailedOperation } from '@services/errorReportingService'
import { useToast } from '../../../../../contexts/ToastContext'
import {
  buildWeekPractice, sessionsInWeek, currentStreak, lastSession, todayIso, shiftDate,
} from '@kaer/shared'
import { useTeen } from '../../../../../hooks/useTeen'
import { BreathingExercisePlayer } from './BreathingExercisePlayer'
import { PrimaryTechniqueCard } from './PrimaryTechniqueCard'
import { WeekCard, type ReminderLine } from './WeekCard'
import { TechniqueRow } from './TechniqueRow'
import { GoalSheet } from './GoalSheet'
import { ReminderSheet, type ReminderDraft } from './ReminderSheet'
import { TechniqueInfoSheet } from './TechniqueInfoSheet'
import { DISPLAY_WEEK_DAY_KEYS, formatReminderDays } from './weekDayOrder'
import { formatSessionDuration } from './formatDuration'
import { hubStyles } from './hubStyles'

export interface BreathingPacerLayoutProps {
  fields: ContentField[]
  moduleId: string
}

/**
 * Feuille ouverte par-dessus le hub. Un seul état discriminé plutôt que trois
 * booléens : deux feuilles simultanées deviennent irreprésentables.
 */
type ActiveSheet =
  | { kind: 'goal' }
  | { kind: 'reminder' }
  | { kind: 'info'; technique: BreathingTechnique }

/**
 * Lecture des réglages. Tant qu'ils ne sont pas lus, **rien de ce qui écrit** n'est
 * rendu : un formulaire atteignable avant sa config enregistre des valeurs de repli
 * à la place des vraies, sans que rien ne le signale.
 */
type SettingsState =
  | { status: 'loading' }
  | { status: 'ready'; settings: BreathingSettings }
  | { status: 'error' }

const LOADING: SettingsState = { status: 'loading' }

/** Icône de l'état « aucune technique activée » : JSX statique, hors du rendu. */
const EMPTY_ICON = <MaterialCommunityIcons name="lungs" size={40} color={colors.textMuted} />

/** Motif de l'échec, pour la télémétrie technique (jamais de donnée patient). */
function asReason(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Hub du module « Techniques de respiration » (epic #195, M1). Remplace la liste
 * académique des cinq techniques.
 *
 * Trois blocs : la technique travaillée en séance, la semaine en cours, puis les
 * autres techniques activées. Le patient ne voit **que** ce que son praticien a
 * activé : aucune technique verrouillée, aucun teaser.
 *
 * Conformité MDR 2017/745 : la série et les compteurs sont des restitutions brutes,
 * sans félicitation ni jugement calculé, et aucune couleur ne varie selon la valeur.
 */
export function BreathingPacerLayout({ fields, moduleId }: BreathingPacerLayoutProps) {
  const { isTeenMode } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const { showToast } = useToast()

  const [sessions, setSessions] = useState<BreathingSession[]>([])
  const [settingsState, setSettingsState] = useState<SettingsState>(LOADING)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null)
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique | null>(null)

  const lbl = useCallback(
    (key: string, params?: Record<string, string | number>) => t(`modules.${moduleId}.${key}`, params),
    [t, moduleId],
  )

  const loadSessions = useCallback(() => {
    fetchBreathingSessions()
      .then(setSessions)
      .catch((err: unknown) => {
        // L'historique manquant n'empêche pas de respirer : le hub reste utilisable
        // avec des compteurs à zéro, mais l'échec est remonté (jamais avalé).
        setSessions([])
        reportFailedOperation(`module/${moduleId}/hub`, 'breathing sessions unreadable', asReason(err))
      })
  }, [moduleId])

  const loadSettings = useCallback(() => {
    setSettingsState(LOADING)
    fetchBreathingSettings()
      .then(settings => setSettingsState({ status: 'ready', settings }))
      // On ne bascule PAS sur des réglages par défaut : le patient enregistrerait
      // alors un objectif ou un rappel calculés sur des valeurs qui ne sont pas les
      // siennes, en écrasant les vraies. Écran d'erreur + réessai, aucune écriture.
      .catch((err: unknown) => {
        setSettingsState({ status: 'error' })
        reportFailedOperation(`module/${moduleId}/hub`, 'breathing settings unreadable', asReason(err))
      })
  }, [moduleId])

  useEffect(() => {
    loadSessions()
    loadSettings()
  }, [loadSessions, loadSettings])

  const settings = settingsState.status === 'ready' ? settingsState.settings : null

  const techniques = useMemo(() => techniquesFromFields(fields), [fields])
  const config = useMemo(() => breathingConfigFromFields(fields), [fields])
  const activation = useMemo(
    () => settings != null ? resolveActivation(techniques, settings, config) : null,
    [techniques, settings, config],
  )

  // Le jour de référence est figé au montage : recalculer `todayIso()` à chaque
  // rendu ferait bouger la semaine affichée sous les doigts du patient.
  const today = useMemo(() => todayIso(), [])
  const week = useMemo(() => buildWeekPractice(sessions, today), [sessions, today])
  const streak = useMemo(() => currentStreak(sessions, today), [sessions, today])
  const doneThisWeek = useMemo(() => sessionsInWeek(sessions, today), [sessions, today])

  const dayLabels = useMemo(
    () => DISPLAY_WEEK_DAY_KEYS.map(key => t(`notifications.day_${key}`)),
    [t],
  )

  const lastSessionLabel = useMemo(() => {
    const last = lastSession(sessions)
    if (last == null) return null
    const when = last.date === today ? t('common.today')
      : last.date === shiftDate(today, -1) ? t('common.yesterday')
      // Ancrage à midi local : minuit basculerait d'un jour en fuseau positif.
      // La locale suit la langue de l'app, elle n'est jamais figée à `fr-FR`.
      : new Date(`${last.date}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
    return lbl('hub_last_session', {
      when,
      duration: formatSessionDuration(last.duration_seconds, lbl),
    })
  }, [sessions, today, lbl, t, i18n.language])

  const openGoal = useCallback(() => setActiveSheet({ kind: 'goal' }), [])
  const openReminder = useCallback(() => setActiveSheet({ kind: 'reminder' }), [])
  const closeSheet = useCallback(() => setActiveSheet(null), [])
  const openInfo = useCallback(() => {
    if (activation?.primary != null) setActiveSheet({ kind: 'info', technique: activation.primary })
  }, [activation])

  const startPrimary = useCallback(() => {
    if (activation?.primary != null) setActiveTechnique(activation.primary)
  }, [activation])

  const openTechnique = useCallback((techniqueKey: string) => {
    const found = techniques.find(tech => tech.key === techniqueKey)
    if (found) setActiveTechnique(found)
  }, [techniques])

  // Ferme le lecteur ; si une session a été enregistrée, rafraîchit l'historique.
  const closePlayer = useCallback((saved: boolean) => {
    setActiveTechnique(null)
    if (saved) loadSessions()
  }, [loadSessions])

  // Écriture des réglages : l'état local suit l'écriture pour que le hub reflète
  // immédiatement le choix, la synchro distante étant gérée par le service.
  const persist = useCallback((next: BreathingSettings) => {
    setSettingsState({ status: 'ready', settings: next })
    setActiveSheet(null)
    saveBreathingSettings(next).catch((err: unknown) => {
      // L'écriture locale a échoué : rien n'est parti dans l'outbox de sync, donc
      // le réglage est perdu. Le patient doit le savoir, et l'échec être remonté.
      showToast(t('common.save_error'), 'error')
      reportFailedOperation(`module/${moduleId}/hub`, 'breathing settings write failed', asReason(err))
    })
  }, [showToast, t, moduleId])

  const saveGoal = useCallback((goal: number) => {
    if (settings != null) persist({ ...settings, weekly_goal_sessions: goal })
  }, [settings, persist])

  const saveReminder = useCallback((draft: ReminderDraft) => {
    if (settings == null) return
    persist({
      ...settings,
      reminder_enabled: draft.enabled,
      reminder_time: draft.time,
      reminder_days: draft.days,
    })
  }, [settings, persist])

  const reminderDraft = useMemo<ReminderDraft>(() => ({
    enabled: settings?.reminder_enabled ?? false,
    time: settings?.reminder_time ?? null,
    days: settings?.reminder_days ?? [],
  }), [settings])

  const reminder = useMemo<ReminderLine>(() => {
    const hasReminder = reminderDraft.enabled && reminderDraft.time != null
    const days = formatReminderDays(reminderDraft.days, dayLabels, t('notifications.every_day'))
    return {
      summary: hasReminder
        ? lbl('hub_reminder_on', { days, time: reminderDraft.time ?? '' })
        : lbl('hub_reminder_off'),
      actionLabel: hasReminder ? t('common.modify') : lbl('hub_reminder_create'),
      onPress: openReminder,
    }
  }, [reminderDraft, dayLabels, lbl, t, openReminder])

  if (settingsState.status === 'error') {
    return (
      <EmptyState
        icon={EMPTY_ICON}
        title={lbl('hub_error_title')}
        description={lbl('hub_error_description')}
        action={{ label: t('common.retry'), onPress: loadSettings, testID: 'breathing-retry' }}
        testID="breathing-error"
      />
    )
  }
  if (settings == null || activation == null) return <ScreenLoader testID="breathing-loader" />

  const { primary, others } = activation

  return (
    <>
      <ScrollView contentContainerStyle={hubStyles.container}>
        {primary != null ? (
          <PrimaryTechniqueCard
            technique={primary}
            durationMin={settings.preferred_duration_min}
            lastSessionLabel={lastSessionLabel}
            lbl={lbl}
            onStart={startPrimary}
            onInfo={openInfo}
          />
        ) : (
          <EmptyState
            icon={EMPTY_ICON}
            title={lbl('hub_empty_title')}
            description={lbl('hub_empty_description')}
            testID="breathing-empty"
          />
        )}

        <WeekCard
          days={week}
          dayLabels={dayLabels}
          streak={streak}
          done={doneThisWeek}
          goal={settings.weekly_goal_sessions}
          color={primary?.color ?? colors.primary}
          lbl={lbl}
          onAdjustGoal={openGoal}
          reminder={reminder}
        />

        {others.length > 0 ? (
          <>
            <Text style={hubStyles.sectionTitle}>{lbl('hub_your_techniques')}</Text>
            {others.map(technique => (
              <TechniqueRow
                key={technique.key}
                technique={technique}
                lbl={lbl}
                onOpen={openTechnique}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <GoalSheet
        visible={activeSheet?.kind === 'goal'}
        value={settings.weekly_goal_sessions}
        onClose={closeSheet}
        onSave={saveGoal}
        lbl={lbl}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ReminderSheet
        visible={activeSheet?.kind === 'reminder'}
        value={reminderDraft}
        onClose={closeSheet}
        onSave={saveReminder}
        lbl={lbl}
        dayLabels={dayLabels}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
        confirmLabel={t('common.ok')}
      />

      {activeSheet?.kind === 'info' ? (
        <TechniqueInfoSheet
          visible
          technique={activeSheet.technique}
          onClose={closeSheet}
          lbl={lbl}
          closeLabel={t('common.close')}
        />
      ) : null}

      <Modal
        visible={activeTechnique != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => closePlayer(false)}
      >
        {activeTechnique != null ? (
          <BreathingExercisePlayer technique={activeTechnique} moduleId={moduleId} onClose={closePlayer} />
        ) : null}
      </Modal>
    </>
  )
}
