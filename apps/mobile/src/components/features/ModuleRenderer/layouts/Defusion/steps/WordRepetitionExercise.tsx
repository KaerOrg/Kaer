import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Button } from '@ui/Button'
import { colors, spacing, radius } from '@theme'
import { useConfirmDialog } from '../../../../../../contexts/ConfirmDialogContext'
import { Halo } from '../Halo'

export interface WordRepetitionExerciseProps {
  word: string
  accent: string
  instruction: string
  remainingLabel: (seconds: number) => string
  pauseLabel: string
  resumeLabel: string
  stopLabel: string
  pausedLabel: string
  confirm: { title: string; message: string; confirmLabel: string }
  /** Durée réelle écoulée (secondes) — 30 si menée à terme, moins si arrêt anticipé. */
  onDone: (durationSeconds: number) => void
}

const DURATION_SECONDS = 30

/**
 * Étape C — exercice de répétition de mot. Cadence visuelle 1 Hz par le halo
 * (animation native), 30 s. Le `setInterval` ne pilote QUE le décompte des secondes
 * (état), jamais l'animation (halo natif). Pas de X de fermeture pendant l'exercice
 * ni en pause : la seule sortie est « Arrêter » + ConfirmDialog. MDR : aucun message
 * d'encouragement, aucune couleur conditionnelle — le mot et le temps restant, rien
 * d'autre.
 */
export function WordRepetitionExercise({
  word, accent, instruction, remainingLabel,
  pauseLabel, resumeLabel, stopLabel, pausedLabel, confirm, onDone,
}: WordRepetitionExerciseProps) {
  const { showConfirm } = useConfirmDialog()
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(true)
  const doneRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const finish = useCallback((seconds: number) => {
    if (doneRef.current) return
    doneRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    onDone(seconds)
  }, [onDone])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= DURATION_SECONDS) finish(DURATION_SECONDS)
        return Math.min(next, DURATION_SECONDS)
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, finish])

  const togglePause = useCallback(() => setRunning((r) => !r), [])

  const requestStop = useCallback(() => {
    setRunning(false)
    showConfirm({
      title: confirm.title,
      message: confirm.message,
      confirmLabel: confirm.confirmLabel,
      onConfirm: () => finish(elapsed),
    })
  }, [showConfirm, confirm, finish, elapsed])

  const remaining = DURATION_SECONDS - elapsed
  const progress = elapsed / DURATION_SECONDS

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{instruction}</Text>

      <View style={styles.haloWrap}>
        <Halo color={accent} active={running}>
          <Text style={[styles.word, !running && styles.wordPaused]} numberOfLines={2} adjustsFontSizeToFit>
            {word}
          </Text>
        </Halo>
        {!running ? <Text style={styles.pausedLabel}>{pausedLabel}</Text> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <Text style={styles.remaining}>{remainingLabel(remaining)}</Text>

        <View style={styles.controls}>
          <Button
            variant="secondary"
            iconLeft={<MaterialCommunityIcons name={running ? 'pause' : 'play'} size={22} color={colors.text} />}
            label={running ? pauseLabel : resumeLabel}
            onPress={togglePause}
          />
          <Button variant="ghost" label={stopLabel} onPress={requestStop} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'space-between' },
  instruction: { fontSize: 15, color: colors.textMuted, textAlign: 'center', paddingTop: spacing.md },
  haloWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  word: { fontSize: 42, fontWeight: '700', color: colors.text, textAlign: 'center' },
  wordPaused: { opacity: 0.35 },
  pausedLabel: { fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  footer: { width: '100%', gap: spacing.sm },
  progressTrack: { height: 4, borderRadius: radius.full, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: radius.full },
  remaining: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  controls: { gap: spacing.sm, marginTop: spacing.xs },
})
