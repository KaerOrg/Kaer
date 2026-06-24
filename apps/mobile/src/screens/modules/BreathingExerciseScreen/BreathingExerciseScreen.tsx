import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  fetchBreathingTechniques,
  getCycleDuration,
  saveBreathingSession,
  type BreathingTechnique,
} from '../../../services/breathingService'
import { generateId } from '../../../lib/database'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius } from '@theme'
import { useTranslation } from 'react-i18next'
import { useConfirmDialog } from '../../../contexts/ConfirmDialogContext'
import { useTeen } from '../../../hooks/useTeen'
import { TeenAccent } from '../../../components/features/TeenAccent'
import { BreathCircle } from './BreathCircle'
import { PhaseBar } from './PhaseBar'

type RouteType = RouteProp<AppStackParamList, 'BreathingExercise'>

export default function BreathingExerciseScreen() {
  const { t } = useTranslation()
  const { teenColor } = useTeen()
  const navigation = useNavigation()
  const route = useRoute<RouteType>()
  const { showConfirm } = useConfirmDialog()

  // Config chargée depuis la base (config-first) : trois états exclusifs.
  const [techState, setTechState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; technique: BreathingTechnique }
    | { status: 'not_found' }
  >({ status: 'loading' })
  const technique = techState.status === 'ready' ? techState.technique : null

  useEffect(() => {
    let active = true
    fetchBreathingTechniques()
      .then((techs) => {
        if (!active) return
        const found = techs.find((tch) => tch.key === route.params.techniqueKey)
        setTechState(found ? { status: 'ready', technique: found } : { status: 'not_found' })
      })
      .catch(() => {
        if (active) setTechState({ status: 'not_found' })
      })
    return () => {
      active = false
    }
  }, [route.params.techniqueKey])

  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondInPhase, setSecondInPhase] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      } catch {
        // Échec silencieux — la session n'est pas critique
      }
    }
  }, [totalSeconds, technique])

  const handleStop = useCallback(() => {
    showConfirm({
      title: t('modules.breathing_techniques.stop_confirm_title'),
      message: t('modules.breathing_techniques.stop_confirm_msg'),
      confirmLabel: t('modules.breathing_techniques.stop_confirm_finish'),
      onConfirm: async () => {
        await stop(true)
        navigation.goBack()
      },
    })
  }, [stop, navigation, showConfirm, t])

  const handleStart = useCallback(() => {
    setPhaseIndex(0)
    setSecondInPhase(0)
    setRunning(true)
  }, [])

  const handlePause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

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

  if (techState.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (techState.status === 'not_found' || !technique) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('modules.breathing_techniques.technique_not_found')}</Text>
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
      <TeenAccent color={teenColor('breathing_techniques')} />
      <View style={styles.container}>

        {/* En-tête */}
        <View style={styles.header}>
          <Text style={[styles.techniqueName, { color: technique.color }]}>
            {t(`modules.breathing_techniques.${technique.key}_name`)}
          </Text>
          <Text style={styles.cycleInfo}>
            {t('modules.breathing_techniques.cycle_label', { count: cycleCount + 1, duration: cycleDuration })}
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
                {t(`modules.breathing_techniques.phase_${p.type}`)}
              </Text>
            ))}
          </View>
        </View>

        {/* Compteurs */}
        <View style={styles.counters}>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>{cycleCount}</Text>
            <Text style={styles.counterLabel}>{cycleCount > 1 ? t('modules.breathing_techniques.cycles_label_plural') : t('modules.breathing_techniques.cycles_label')}</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>
              {totalMins > 0 ? `${totalMins}:${String(totalSecs).padStart(2, '0')}` : `${totalSecs}s`}
            </Text>
            <Text style={styles.counterLabel}>{t('modules.breathing_techniques.duration_label')}</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.controls}>
          {!running ? (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: technique.color }]}
              onPress={handleStart}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={totalSeconds === 0 ? t('modules.breathing_techniques.start_btn') : t('modules.breathing_techniques.resume_btn')}
            >
              <MaterialCommunityIcons name="play" size={28} color={colors.white} />
              <Text style={styles.mainBtnText}>
                {totalSeconds === 0 ? t('modules.breathing_techniques.start_btn') : t('modules.breathing_techniques.resume_btn')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: technique.color }]}
              onPress={handlePause}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('modules.breathing_techniques.pause_btn')}
            >
              <MaterialCommunityIcons name="pause" size={28} color={colors.white} />
              <Text style={styles.mainBtnText}>{t('modules.breathing_techniques.pause_btn')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStop}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('modules.breathing_techniques.stop_btn')}
          >
            <MaterialCommunityIcons name="stop" size={22} color={colors.textMuted} />
            <Text style={styles.stopBtnText}>{t('modules.breathing_techniques.stop_btn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Durée recommandée */}
        <Text style={styles.hint}>
          {t('modules.breathing_techniques.recommended_hint', {
            min: technique.recommended_duration_min,
            evidence: t(`modules.breathing_techniques.${technique.key}_evidence`),
          })}
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
