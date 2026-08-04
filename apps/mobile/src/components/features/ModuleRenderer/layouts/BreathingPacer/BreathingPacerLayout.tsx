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
  saveBreathingSession,
  saveBreathingSettings,
  techniquesFromFields,
  breathingConfigFromFields,
  resolveActivation,
  type BreathingFeeling,
  type BreathingSession,
  type BreathingSettings,
  type BreathingTechnique,
} from '@services/breathingService'
import type { ContentField } from '@services/moduleService'
import { reportFailedOperation } from '@services/errorReportingService'
import { syncBreathingReminders } from '@services/breathingReminderService'
import { useToast } from '../../../../../contexts/ToastContext'
import {
  buildWeekPractice, sessionsInWeek, currentStreak, lastSession, todayIso, shiftDate,
} from '@kaer/shared'
import { generateId } from '../../../../../lib/database'
import { useTeen } from '../../../../../hooks/useTeen'
import { BreathingSessionScreen, type SessionResult } from './BreathingSessionScreen'
import { SessionSummaryScreen } from './SessionSummaryScreen'
import { PrimaryTechniqueCard } from './PrimaryTechniqueCard'
import { WeekCard, type ReminderLine } from './WeekCard'
import { TechniqueRow } from './TechniqueRow'
import { GoalSheet } from './GoalSheet'
import { ReminderSheet, type ReminderDraft } from './ReminderSheet'
import { TechniqueInfoSheet } from './TechniqueInfoSheet'
import { PreparationSheet, type PreparationDraft } from './PreparationSheet'
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
  | { kind: 'prepare'; technique: BreathingTechnique }

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

/** Une session terminée, en attente de sa clôture (ressenti facultatif). */
interface FinishedSession {
  /** Identifiant de l'entrée déjà écrite : l'ajout du ressenti la met à jour. */
  id: string
  result: SessionResult
}

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
  // Le retour Android sur la modale de session ne la ferme pas : il DEMANDE l'arrêt,
  // et c'est la session qui conclut (elle seule connaît le temps réellement pratiqué).
  const [stopRequested, setStopRequested] = useState(false)
  // La session qui vient de se terminer, le temps de sa clôture. L'`id` est conservé
  // pour que l'ajout du ressenti mette à jour la MÊME entrée, sans en créer une seconde.
  const [finished, setFinished] = useState<FinishedSession | null>(null)

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

  // Démarrer n'ouvre plus l'exercice directement : la feuille de préparation
  // s'intercale pour laisser le temps de s'installer et de régler la session.
  const startPrimary = useCallback(() => {
    if (activation?.primary != null) setActiveSheet({ kind: 'prepare', technique: activation.primary })
  }, [activation])

  const openTechnique = useCallback((techniqueKey: string) => {
    const found = techniques.find(tech => tech.key === techniqueKey)
    if (found) setActiveSheet({ kind: 'prepare', technique: found })
  }, [techniques])

  const requestStop = useCallback(() => setStopRequested(true), [])

  // Écrit la session. Appelée deux fois pour une même session (même `id`, donc
  // upsert) : une fois à la fin de la session, une fois si le patient ajoute un
  // ressenti à la clôture. Écrire dès la fin plutôt qu'à la clôture garantit qu'une
  // session n'est jamais perdue si l'app est fermée sur l'écran de clôture.
  const writeSession = useCallback((
    id: string,
    result: SessionResult,
    feeling: BreathingFeeling | null,
  ) => {
    saveBreathingSession({
      id,
      technique_key: result.techniqueKey,
      started_at: result.startedAt,
      duration_seconds: result.durationSeconds,
      planned_duration_seconds: result.plannedDurationSeconds,
      cycles_completed: result.cyclesCompleted,
      completed: result.completed,
      feeling,
    })
      .then(loadSessions)
      .catch((err: unknown) => {
        showToast(t('common.save_error'), 'error')
        reportFailedOperation(`module/${moduleId}/session`, 'breathing session write failed', asReason(err))
      })
  }, [loadSessions, showToast, t, moduleId])

  // Fin de session : l'écran remonte le résultat, le hub l'enregistre puis présente
  // la clôture. La session est écrite MÊME interrompue (`completed: false`) et MÊME
  // sans ressenti (`feeling: null`) : c'est une donnée, pas un échec.
  const finishSession = useCallback((result: SessionResult) => {
    setActiveTechnique(null)
    setStopRequested(false)
    const id = generateId()
    setFinished({ id, result })
    writeSession(id, result, null)
  }, [writeSession])

  // Clôture. « Passer » (feeling `null`) n'écrit rien de plus : la session est déjà
  // enregistrée, et aucun refus n'est noté nulle part.
  const closeSummary = useCallback((feeling: BreathingFeeling | null) => {
    if (finished != null && feeling != null) writeSession(finished.id, finished.result, feeling)
    setFinished(null)
  }, [finished, writeSession])

  // Retour Android sur la clôture : équivaut à « Passer », jamais à une perte.
  const skipSummary = useCallback(() => setFinished(null), [])

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
    const next = {
      ...settings,
      reminder_enabled: draft.enabled,
      reminder_time: draft.time,
      reminder_days: draft.days,
    }
    persist(next)
    // Les notifications de l'appareil suivent le réglage : annulées puis
    // reprogrammées, donc jamais en double. Le texte part d'ici, déjà traduit et
    // sans interpolation possible (invariant MDR du rappel neutre).
    syncBreathingReminders(next, lbl('reminder_notification_title'), lbl('reminder_notification_body'))
      .then(result => {
        // Le réglage reste enregistré même si l'OS refuse : on le dit, sans bloquer.
        if (result.status === 'permission_denied') showToast(lbl('reminder_denied_toast'), 'info')
      })
      .catch((err: unknown) => {
        reportFailedOperation(`module/${moduleId}/reminder`, 'breathing reminder scheduling failed', asReason(err))
      })
  }, [settings, persist, lbl, showToast, moduleId])

  // Démarre la session avec les réglages de la feuille, en les mémorisant pour la
  // prochaine : la feuille se rouvrira sur ces choix.
  const startSession = useCallback((draft: PreparationDraft) => {
    if (settings == null) return
    const technique = activeSheet?.kind === 'prepare' ? activeSheet.technique : null
    persist({
      ...settings,
      preferred_duration_min: draft.durationMin,
      haptics: draft.haptics,
      breath_sound: draft.breathSound,
      ambient_sound: draft.ambientSound,
      ambient_sound_key: draft.ambientSoundKey,
    })
    setActiveTechnique(technique)
  }, [settings, activeSheet, persist])

  const preparationDraft = useMemo<PreparationDraft>(() => ({
    durationMin: settings?.preferred_duration_min ?? 0,
    haptics: settings?.haptics ?? true,
    breathSound: settings?.breath_sound ?? false,
    ambientSound: settings?.ambient_sound ?? false,
    ambientSoundKey: settings?.ambient_sound_key ?? 'river',
  }), [settings])

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

      {activeSheet?.kind === 'prepare' ? (
        <PreparationSheet
          visible
          technique={activeSheet.technique}
          value={preparationDraft}
          durations={config.durationsMin}
          ambientSounds={config.ambientSounds}
          onClose={closeSheet}
          onStart={startSession}
          lbl={lbl}
          closeLabel={t('common.close')}
        />
      ) : null}

      <Modal
        visible={activeTechnique != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={requestStop}
      >
        {activeTechnique != null ? (
          <BreathingSessionScreen
            technique={activeTechnique}
            settings={settings}
            lbl={lbl}
            stopRequested={stopRequested}
            onFinish={finishSession}
          />
        ) : null}
      </Modal>

      <Modal
        visible={finished != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={skipSummary}
      >
        {finished != null ? (
          <SessionSummaryScreen
            result={finished.result}
            techniqueName={lbl(`${finished.result.techniqueKey}_name`)}
            streak={streak}
            lbl={lbl}
            onClose={closeSummary}
          />
        ) : null}
      </Modal>
    </>
  )
}
