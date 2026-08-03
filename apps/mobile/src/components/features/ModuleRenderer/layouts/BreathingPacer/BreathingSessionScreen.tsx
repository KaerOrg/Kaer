import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Text, Vibration, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useKeepAwake } from 'expo-keep-awake'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import type { BreathingSettings, BreathingTechnique } from '@services/breathingService'
import { SessionOrb } from './SessionOrb'
import { SessionProgress } from './SessionProgress'
import { SessionControls } from './SessionControls'
import { CLOCK_IDLE, startClock, pauseClock, elapsedSeconds as clockElapsed } from './sessionClock'
import { cursorAt, isCompleted } from './sessionPhases'
import { getSessionAudio, hasAudioAssets } from './sessionAudio'
import { SESSION_COLORS, sessionStyles } from './sessionStyles'
import type { LabelFn } from './types'

/** Ce que la session remonte au layout, qui décide de l'enregistrement. */
export interface SessionResult {
  techniqueKey: string
  /** Horodatage ISO du début de session (date métier, locale). */
  startedAt: string
  durationSeconds: number
  plannedDurationSeconds: number
  cyclesCompleted: number
  /** Menée au bout (au moins la moitié de la durée choisie) vs interrompue. */
  completed: boolean
}

export interface BreathingSessionScreenProps {
  technique: BreathingTechnique
  /** Réglages de la préparation : durée, vibrations, souffle, ambiance. */
  settings: BreathingSettings
  lbl: LabelFn
  /**
   * Arrêt demandé de l'extérieur (retour Android sur la modale). Passer à `true`
   * termine la session comme le bouton d'arrêt : la sortie est toujours enregistrée,
   * jamais un abandon silencieux.
   */
  stopRequested: boolean
  /** Fin de session, automatique ou anticipée. Le layout persiste et enchaîne. */
  onFinish: (result: SessionResult) => void
}

/** Cadence de rafraîchissement de l'affichage (décompte, jauge), pas de l'animation. */
const DISPLAY_TICK_MS = 200
/** Durée de la vibration de changement de phase, en millisecondes. */
const PHASE_VIBRATION_MS = 15

/**
 * Écran de session immersif. Plein écran, couleurs sombres **codées en dur** : c'est
 * un choix d'écran, PAS le chantier « dark mode » global (le thème ne bouge nulle part
 * ailleurs).
 *
 * L'orbe s'anime en continu via `Animated` avec driver natif. Le timer de cet écran ne
 * pilote **que l'affichage** (décompte, jauge) : il rafraîchit plus vite qu'une
 * seconde et lit une horloge murale, donc il ne dérive pas et ne saccade pas la
 * respiration.
 *
 * Quitter l'app met la session en pause : elle ne continue pas en fond, et la reprise
 * repart exactement où on en était. L'écran reste allumé pendant toute la session, le
 * verrou étant relâché au démontage.
 */
export function BreathingSessionScreen({
  technique, settings, lbl, stopRequested, onFinish,
}: BreathingSessionScreenProps) {
  useKeepAwake()

  const plannedSeconds = Math.max(1, settings.preferred_duration_min) * 60
  const audio = useMemo(() => getSessionAudio(), [])
  const startedAtRef = useRef(new Date().toISOString())
  const clockRef = useRef(startClock(CLOCK_IDLE, Date.now()))
  const finishedRef = useRef(false)

  const [running, setRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)

  const cursor = useMemo(() => cursorAt(technique.phases, elapsed), [technique.phases, elapsed])

  // Fin de session : une seule fois, que la sortie soit automatique ou anticipée.
  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    clockRef.current = pauseClock(clockRef.current, Date.now())
    const durationSeconds = Math.round(clockElapsed(clockRef.current, Date.now()))
    audio.stopAll()
    onFinish({
      techniqueKey: technique.key,
      startedAt: startedAtRef.current,
      durationSeconds,
      plannedDurationSeconds: plannedSeconds,
      cyclesCompleted: cursorAt(technique.phases, durationSeconds)?.cyclesCompleted ?? 0,
      completed: isCompleted(durationSeconds, plannedSeconds),
    })
  }, [audio, onFinish, technique, plannedSeconds])

  // Rafraîchissement de l'AFFICHAGE seulement : l'horloge fait foi, ce tick ne fait
  // que la lire. La fin automatique est déclenchée ici, à la durée choisie.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      const seconds = clockElapsed(clockRef.current, Date.now())
      setElapsed(seconds)
      if (seconds >= plannedSeconds) finish()
    }, DISPLAY_TICK_MS)
    return () => clearInterval(timer)
  }, [running, plannedSeconds, finish])

  // Retour Android : termine la session comme le bouton d'arrêt.
  useEffect(() => {
    if (stopRequested) finish()
  }, [stopRequested, finish])

  // Quitter l'app met la session en pause : elle ne tourne pas en arrière-plan.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        clockRef.current = pauseClock(clockRef.current, Date.now())
        setRunning(false)
      }
    })
    return () => subscription.remove()
  }, [])

  // Ambiance : fondu entrant au démarrage, sortant à la sortie de l'écran.
  useEffect(() => {
    if (settings.ambient_sound) audio.startAmbient(settings.ambient_sound_key)
    return () => audio.stopAll()
  }, [audio, settings.ambient_sound, settings.ambient_sound_key])

  // Repères de changement de phase : vibration et souffle guidé, chacun sous sa
  // bascule. Se déclenche sur l'instance de phase, donc une fois par phase.
  const phaseInstance = cursor?.phaseInstance ?? 0
  const phaseType = cursor?.phaseIndex != null ? technique.phases[cursor.phaseIndex].type : null
  const phaseSeconds = cursor?.phaseSeconds ?? 0
  useEffect(() => {
    if (!running || phaseType == null) return
    if (settings.haptics) Vibration.vibrate(PHASE_VIBRATION_MS)
    if (settings.breath_sound && !muted) audio.playBreath(phaseType, phaseSeconds)
    // `phaseType`/`phaseSeconds` sont dérivés de `phaseInstance` : les lister ne
    // multiplie pas les déclenchements, mais satisfait la règle des dépendances.
  }, [phaseInstance, phaseType, phaseSeconds, running, settings.haptics, settings.breath_sound, muted, audio])

  const togglePause = useCallback(() => {
    setRunning(prev => {
      clockRef.current = prev
        ? pauseClock(clockRef.current, Date.now())
        : startClock(clockRef.current, Date.now())
      return !prev
    })
  }, [])

  const toggleSound = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      if (next) audio.stopAmbient()
      else if (settings.ambient_sound) audio.startAmbient(settings.ambient_sound_key)
      return next
    })
  }, [audio, settings.ambient_sound, settings.ambient_sound_key])

  const phaseVerb = phaseType != null ? lbl(`phase_${phaseType}`) : ''

  return (
    <View style={sessionStyles.screen} testID="breathing-session">
      <StatusBar style="light" />
      <Svg style={sessionStyles.background}>
        <Defs>
          <LinearGradient id="sessionBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SESSION_COLORS.gradientTop} />
            <Stop offset="0.55" stopColor={SESSION_COLORS.gradientMid} />
            <Stop offset="1" stopColor={SESSION_COLORS.gradientBottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sessionBg)" />
      </Svg>

      <SafeAreaView style={sessionStyles.content} edges={SAFE_EDGES}>
        <SessionProgress
          elapsedSeconds={elapsed}
          plannedSeconds={plannedSeconds}
          accessibilityLabel={lbl('session_progress_a11y')}
        />

        <View style={sessionStyles.center}>
          <SessionOrb
            phaseType={phaseType ?? 'inhale'}
            phaseInstance={phaseInstance}
            remainingInPhase={cursor?.remainingInPhase ?? 1}
            running={running}
          >
            <Text style={sessionStyles.countdown} testID="session-countdown">
              {cursor?.remainingInPhase ?? 0}
            </Text>
          </SessionOrb>
          <Text style={sessionStyles.phaseVerb} testID="session-phase">{phaseVerb}</Text>
          <Text style={sessionStyles.cycleLine}>
            {lbl('session_cycle', {
              count: (cursor?.cyclesCompleted ?? 0) + 1,
              technique: lbl(`${technique.key}_name`),
            })}
          </Text>
        </View>

        <View style={sessionStyles.bottom}>
          <SessionControls
            running={running}
            muted={hasAudioAssets() ? muted : null}
            onToggleSound={toggleSound}
            onTogglePause={togglePause}
            onStop={finish}
            soundLabel={lbl(muted ? 'session_unmute' : 'session_mute')}
            pauseLabel={lbl(running ? 'session_pause' : 'session_resume')}
            stopLabel={lbl('session_stop')}
          />
          {settings.haptics ? (
            <Text style={sessionStyles.hapticHint}>{lbl('session_haptic_hint')}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  )
}

/** Bords de la zone sûre : le dégradé occupe l'écran entier, le contenu s'y encadre. */
const SAFE_EDGES = ['top', 'bottom'] as const
