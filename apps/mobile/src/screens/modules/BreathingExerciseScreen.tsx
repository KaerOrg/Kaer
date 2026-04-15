import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { getTechnique, getCycleDuration, type BreathingPhase } from '../../constants/breathingTechniques'
import { saveBreathingSession, generateId } from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'

type RouteType = RouteProp<AppStackParamList, 'BreathingExercise'>

// ─── Cercle animé ─────────────────────────────────────────────────────────────
// Animation pure JS — pas de bibliothèque d'animation requise.
// Le cercle scale entre 0.55 (expiration/pause) et 1.0 (inspiration complète).

interface BreathCircleProps {
  phase: BreathingPhase
  progress: number  // 0 → 1 au sein de la phase courante
  color: string
  countdown: number
}

function BreathCircle({ phase, progress, color, countdown }: BreathCircleProps) {
  // Scale : inspiration → grandit, expiration → rétrécit, rétentions → stable
  const getScale = () => {
    switch (phase.type) {
      case 'inhale':    return 0.55 + 0.45 * progress
      case 'hold_in':   return 1.0
      case 'exhale':    return 1.0 - 0.45 * progress
      case 'hold_out':  return 0.55
    }
  }

  const scale = getScale()
  const size = 220
  const innerSize = size * scale

  return (
    <View style={[circleStyles.outer, { width: size, height: size, borderColor: color + '33' }]}>
      <View
        style={[
          circleStyles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: color + '22',
            borderColor: color,
          },
        ]}
      >
        <Text style={[circleStyles.countdown, { color }]}>{countdown}</Text>
        <Text style={[circleStyles.phaseLabel, { color }]}>{phase.label}</Text>
      </View>
    </View>
  )
}

const circleStyles = StyleSheet.create({
  outer: {
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countdown: { fontSize: 40, fontWeight: '800' },
  phaseLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: spacing.sm },
})

// ─── Barre de progression des phases ─────────────────────────────────────────

interface PhaseBarProps {
  phases: BreathingPhase[]
  currentPhaseIndex: number
  color: string
}

function PhaseBar({ phases, currentPhaseIndex, color }: PhaseBarProps) {
  return (
    <View style={phaseBarStyles.container}>
      {phases.map((phase, i) => (
        <View
          key={i}
          style={[
            phaseBarStyles.segment,
            { flex: phase.seconds },
            i === currentPhaseIndex && { backgroundColor: color },
            i < currentPhaseIndex && { backgroundColor: color + '55' },
          ]}
        />
      ))}
    </View>
  )
}

const phaseBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.border,
    gap: 2,
  },
  segment: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function BreathingExerciseScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteType>()
  const patient = useAuthStore((s) => s.patient)

  const technique = getTechnique(route.params.techniqueKey)

  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondInPhase, setSecondInPhase] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const stop = useCallback(async (save: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)

    if (save && totalSeconds > 0 && technique) {
      try {
        await saveBreathingSession({
          id: generateId(),
          date: new Date().toISOString().slice(0, 10),
          technique_key: technique.key,
          duration_seconds: totalSeconds,
        })
        if (patient?.id) {
          await supabase.from('patient_engagement_logs').insert({
            patient_id: patient.id,
            event_type: 'SAVE_BREATHING_SESSION',
            metadata: {},
          })
        }
      } catch {
        // Échec silencieux — la session n'est pas critique
      }
    }
  }, [totalSeconds, technique, patient])

  const handleStop = useCallback(() => {
    Alert.alert(
      'Arrêter la session ?',
      'Votre progression sera enregistrée.',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            await stop(true)
            navigation.goBack()
          },
        },
      ]
    )
  }, [stop, navigation])

  // Tick toutes les secondes
  useEffect(() => {
    if (!running || !technique) return

    intervalRef.current = setInterval(() => {
      setTotalSeconds((prev) => prev + 1)
      setSecondInPhase((prev) => {
        const phase = technique.phases[phaseIndex]
        if (prev + 1 >= phase.seconds) {
          // Passe à la phase suivante
          const nextPhase = (phaseIndex + 1) % technique.phases.length
          setPhaseIndex(nextPhase)
          if (nextPhase === 0) setCycleCount((c) => c + 1)
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, phaseIndex, technique])

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (!technique) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Technique introuvable.</Text>
      </View>
    )
  }

  const currentPhase = technique.phases[phaseIndex]
  const progress = secondInPhase / currentPhase.seconds
  const countdown = currentPhase.seconds - secondInPhase
  const cycleDuration = getCycleDuration(technique)
  const totalMins = Math.floor(totalSeconds / 60)
  const totalSecs = totalSeconds % 60

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>

        {/* En-tête */}
        <View style={styles.header}>
          <Text style={[styles.techniqueName, { color: technique.color }]}>
            {technique.name}
          </Text>
          <Text style={styles.cycleInfo}>
            Cycle {cycleCount + 1} · {cycleDuration}s par cycle
          </Text>
        </View>

        {/* Cercle animé */}
        <View style={styles.circleWrapper}>
          <BreathCircle
            phase={currentPhase}
            progress={progress}
            color={technique.color}
            countdown={countdown}
          />
        </View>

        {/* Barre des phases */}
        <View style={styles.phaseSection}>
          <PhaseBar
            phases={technique.phases}
            currentPhaseIndex={phaseIndex}
            color={technique.color}
          />
          <View style={styles.phaseLabels}>
            {technique.phases.map((p, i) => (
              <Text
                key={i}
                style={[
                  styles.phaseLabelSmall,
                  { flex: p.seconds },
                  i === phaseIndex && { color: technique.color, fontWeight: '700' },
                ]}
              >
                {p.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Compteurs */}
        <View style={styles.counters}>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>{cycleCount}</Text>
            <Text style={styles.counterLabel}>cycle{cycleCount > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>
              {totalMins > 0 ? `${totalMins}:${String(totalSecs).padStart(2, '0')}` : `${totalSecs}s`}
            </Text>
            <Text style={styles.counterLabel}>durée</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.controls}>
          {!running ? (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: technique.color }]}
              onPress={() => {
                setPhaseIndex(0)
                setSecondInPhase(0)
                setRunning(true)
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Démarrer la session"
            >
              <MaterialCommunityIcons name="play" size={28} color={colors.white} />
              <Text style={styles.mainBtnText}>
                {totalSeconds === 0 ? 'Démarrer' : 'Reprendre'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: technique.color }]}
              onPress={() => {
                if (intervalRef.current) clearInterval(intervalRef.current)
                setRunning(false)
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Mettre en pause"
            >
              <MaterialCommunityIcons name="pause" size={28} color={colors.white} />
              <Text style={styles.mainBtnText}>Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStop}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Terminer la session"
          >
            <MaterialCommunityIcons name="stop" size={22} color={colors.textMuted} />
            <Text style={styles.stopBtnText}>Terminer</Text>
          </TouchableOpacity>
        </View>

        {/* Durée recommandée */}
        <Text style={styles.hint}>
          Durée recommandée : {technique.recommended_duration_min} min · {technique.evidence}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textMuted, fontSize: 15 },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: { alignItems: 'center', gap: 4 },
  techniqueName: { fontSize: 20, fontWeight: '700' },
  cycleInfo: { fontSize: 13, color: colors.textMuted },

  circleWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  phaseSection: { width: '100%', gap: spacing.xs },
  phaseLabels: { flexDirection: 'row' },
  phaseLabelSmall: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  counters: {
    flexDirection: 'row',
    gap: spacing.xl * 2,
    marginVertical: spacing.md,
  },
  counter: { alignItems: 'center', gap: 2 },
  counterValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  counterLabel: { fontSize: 12, color: colors.textMuted },

  controls: { width: '100%', gap: spacing.sm },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  mainBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stopBtnText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },

  hint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingTop: spacing.xs,
  },
})
