import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import {
  getCycleDuration,
  saveBreathingSession,
  type BreathingTechnique,
} from '@services/breathingService'
import { generateId } from '../../../../../lib/database'
import { colors, spacing } from '@theme'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { BreathCircle } from './BreathCircle'
import { PhaseBar } from './PhaseBar'

export interface BreathingExercisePlayerProps {
  technique: BreathingTechnique
  /** Module courant : les clés i18n en sont dérivées (layout générique, non hardcodé). */
  moduleId: string
  /** Ferme le lecteur. `saved` indique si une session vient d'être enregistrée
   * (le parent rafraîchit alors l'historique). */
  onClose: (saved: boolean) => void
}

/**
 * Lecteur d'exercice de respiration : machine d'état multi-phases (inspiration /
 * rétention / expiration) pilotant le cercle animé et la barre de phases. Rendu
 * dans une modale par `BreathingPacerLayout` : reçoit la technique en prop
 * (aucun fetch) et signale la fermeture via `onClose`.
 */
export function BreathingExercisePlayer({ technique, moduleId, onClose }: BreathingExercisePlayerProps) {
  const { t } = useTranslation()
  const { showConfirm } = useConfirmDialog()
  // Clé i18n dérivée du module courant (générique, cf. config-first).
  const mk = useCallback((key: string) => `modules.${moduleId}.${key}`, [moduleId])

  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondInPhase, setSecondInPhase] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(async (save: boolean): Promise<boolean> => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)

    if (save && totalSeconds > 0) {
      try {
        await saveBreathingSession({
          id: generateId(),
          date: new Date().toISOString().slice(0, 10),
          technique_key: technique.key,
          duration_seconds: totalSeconds,
        })
        return true
      } catch {
        // Échec silencieux : la session n'est pas critique
      }
    }
    return false
  }, [totalSeconds, technique])

  // Ferme le lecteur. Si rien n'a démarré → fermeture immédiate ; sinon confirme
  // (l'utilisateur peut avoir tapé par erreur) puis enregistre la session.
  const requestClose = useCallback(() => {
    if (totalSeconds === 0) {
      onClose(false)
      return
    }
    showConfirm({
      title: t(mk('stop_confirm_title')),
      message: t(mk('stop_confirm_msg')),
      confirmLabel: t(mk('stop_confirm_finish')),
      onConfirm: async () => {
        const saved = await stop(true)
        onClose(saved)
      },
    })
  }, [totalSeconds, stop, onClose, showConfirm, t, mk])

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
    if (!running) return

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

  // Accent dynamique de la technique porté au bouton principal ui/Button.
  const mainBtnStyle = useMemo<ViewStyle>(() => ({ backgroundColor: technique.color }), [technique.color])

  const currentPhase = technique.phases[phaseIndex]
  const progress = secondInPhase / currentPhase.seconds
  const countdown = currentPhase.seconds - secondInPhase
  const cycleDuration = getCycleDuration(technique)
  const totalMins = Math.floor(totalSeconds / 60)
  const totalSecs = totalSeconds % 60

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.techniqueName, { color: technique.color }]}>
              {t(mk(`${technique.key}_name`))}
            </Text>
            <Text style={styles.cycleInfo}>
              {t(mk('cycle_label'), { count: cycleCount + 1, duration: cycleDuration })}
            </Text>
          </View>
          <Button
            variant="ghost"
            onPress={requestClose}
            iconLeft={<MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />}
            accessibilityLabel={t('common.close')}
            testID="breathing-close"
          />
        </View>

        {/* Cercle animé */}
        <View style={styles.circleWrapper}>
          <BreathCircle
            phase={currentPhase}
            progress={progress}
            color={technique.color}
            countdown={countdown}
            moduleId={moduleId}
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
                {t(mk(`phase_${p.type}`))}
              </Text>
            ))}
          </View>
        </View>

        {/* Compteurs */}
        <View style={styles.counters}>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>{cycleCount}</Text>
            <Text style={styles.counterLabel}>{cycleCount > 1 ? t(mk('cycles_label_plural')) : t(mk('cycles_label'))}</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>
              {totalMins > 0 ? `${totalMins}:${String(totalSecs).padStart(2, '0')}` : `${totalSecs}s`}
            </Text>
            <Text style={styles.counterLabel}>{t(mk('duration_label'))}</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.controls}>
          {!running ? (
            <Button
              variant="primary"
              style={mainBtnStyle}
              onPress={handleStart}
              iconLeft={<MaterialCommunityIcons name="play" size={28} color={colors.white} />}
              label={totalSeconds === 0 ? t(mk('start_btn')) : t(mk('resume_btn'))}
            />
          ) : (
            <Button
              variant="primary"
              style={mainBtnStyle}
              onPress={handlePause}
              iconLeft={<MaterialCommunityIcons name="pause" size={28} color={colors.white} />}
              label={t(mk('pause_btn'))}
            />
          )}

          <Button
            variant="secondary"
            onPress={requestClose}
            iconLeft={<MaterialCommunityIcons name="stop" size={22} color={colors.textMuted} />}
            label={t(mk('stop_btn'))}
          />
        </View>

        {/* Durée recommandée */}
        <Text style={styles.hint}>
          {t(mk('recommended_hint'), {
            min: technique.recommended_duration_min,
            evidence: t(mk(`${technique.key}_evidence`)),
          })}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: spacing.sm },
  headerText: { flex: 1, alignItems: 'center', gap: 4, paddingLeft: 40 },
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

  hint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingTop: spacing.xs,
  },
})
