import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  saveCognitiveSaturationSession,
  generateId,
} from '../../lib/database'
import { colors, spacing, radius } from '../../theme'

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_WORD_LENGTH = 40
const EXERCISE_DURATION_SECONDS = 90

type Mode = 'input' | 'exercise' | 'done'

// ─── Écran d'exercice ─────────────────────────────────────────────────────────

export default function CognitiveSaturationExerciseScreen() {
  const navigation = useNavigation()

  const [mode, setMode] = useState<Mode>('input')
  const [word, setWord] = useState('')
  const [repetitions, setRepetitions] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXERCISE_DURATION_SECONDS)
  const [saving, setSaving] = useState(false)

  // Durée effective (secondes écoulées depuis le début)
  const elapsedRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Démarrage du timer ────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    elapsedRef.current = 0
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setMode('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleStart() {
    if (!word.trim()) return
    setRepetitions(0)
    setTimeLeft(EXERCISE_DURATION_SECONDS)
    setMode('exercise')
    startTimer()
  }

  function handleTap() {
    Vibration.vibrate(30)
    setRepetitions((prev) => prev + 1)
  }

  function handleStopEarly() {
    if (timerRef.current) clearInterval(timerRef.current)
    setMode('done')
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveCognitiveSaturationSession({
        id: generateId(),
        word: word.trim(),
        repetitions,
        duration_seconds: elapsedRef.current,
      })
    } finally {
      setSaving(false)
      navigation.goBack()
    }
  }

  function handleRestart() {
    if (timerRef.current) clearInterval(timerRef.current)
    setWord('')
    setRepetitions(0)
    setTimeLeft(EXERCISE_DURATION_SECONDS)
    elapsedRef.current = 0
    setMode('input')
  }

  // ── Mode saisie ───────────────────────────────────────────────────────────

  if (mode === 'input') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.container}>

            <View style={styles.inputCard} testID="input-card">
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.inputTitle}>
                Quel mot ou pensée souhaitez-vous travailler ?
              </Text>
              <Text style={styles.inputHint}>
                Choisissez un mot court ou une pensée brève qui vous envahit.
                Exemples : « inutile », « danger », « je vais échouer ».
              </Text>

              <TextInput
                style={styles.wordInput}
                placeholder="Saisissez un mot ou une courte pensée…"
                placeholderTextColor={colors.textMuted}
                value={word}
                onChangeText={(t) => setWord(t.slice(0, MAX_WORD_LENGTH))}
                maxLength={MAX_WORD_LENGTH}
                returnKeyType="done"
                autoFocus
                accessibilityLabel="Mot ou pensée à travailler"
                testID="word-input"
              />
              <Text style={styles.charCount} testID="char-count">
                {word.length}/{MAX_WORD_LENGTH}
              </Text>
            </View>

            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>Comment ça fonctionne</Text>
              <Text style={styles.instructionText}>
                1. Répétez votre mot à voix haute, aussi rapidement que possible.{'\n'}
                2. Appuyez sur le mot à chaque répétition pour comptabiliser.{'\n'}
                3. Continuez pendant {EXERCISE_DURATION_SECONDS} secondes.{'\n\n'}
                À force de répétitions, le mot perd son sens et sa charge émotionnelle
                — c'est l'effet de saturation sémantique.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, !word.trim() && styles.startBtnDisabled]}
              onPress={handleStart}
              activeOpacity={0.85}
              disabled={!word.trim()}
              accessibilityRole="button"
              accessibilityLabel="Démarrer l'exercice"
              testID="confirm-start-button"
            >
              <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.white} />
              <Text style={styles.startBtnText}>Démarrer l'exercice</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  // ── Mode exercice ─────────────────────────────────────────────────────────

  if (mode === 'exercise') {
    const progress = timeLeft / EXERCISE_DURATION_SECONDS

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.exerciseContainer} testID="exercise-mode">

          {/* Barre de progression (temps) */}
          <View style={styles.progressBar} testID="progress-bar">
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.timeLabel} testID="time-label">
            {timeLeft}s
          </Text>

          {/* Compteur de répétitions */}
          <Text style={styles.repCounter} testID="rep-counter">
            {repetitions}
          </Text>
          <Text style={styles.repLabel}>répétitions</Text>

          {/* Zone de tap — le mot */}
          <TouchableOpacity
            style={styles.wordTapArea}
            onPress={handleTap}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Appuyez pour compter une répétition de ${word}`}
            testID="word-tap-button"
          >
            <Text style={styles.wordDisplay} adjustsFontSizeToFit numberOfLines={2}>
              {word}
            </Text>
            <Text style={styles.tapHint}>Appuyez à chaque répétition</Text>
          </TouchableOpacity>

          {/* Bouton stop */}
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStopEarly}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Terminer l'exercice maintenant"
            testID="stop-button"
          >
            <Text style={styles.stopBtnText}>Terminer</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    )
  }

  // ── Mode terminé ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.doneCard} testID="done-card">
          <MaterialCommunityIcons name="check-circle-outline" size={56} color={colors.success} />
          <Text style={styles.doneTitle}>Exercice terminé</Text>
          <Text style={styles.doneText}>
            Observez si le mot vous semble différent maintenant.
          </Text>
        </View>

        {/* Récapitulatif brut */}
        <View style={styles.summaryCard} testID="summary-card">
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="chat-processing-outline" size={18} color={colors.primary} />
            <Text style={styles.summaryWord}>{word}</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue} testID="done-repetitions">
                {repetitions}
              </Text>
              <Text style={styles.summaryStatLabel}>répétitions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue} testID="done-duration">
                {EXERCISE_DURATION_SECONDS - timeLeft}s
              </Text>
              <Text style={styles.summaryStatLabel}>durée</Text>
            </View>
          </View>
        </View>

        {/* Boutons */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer et terminer"
          testID="save-button"
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Enregistrement…' : 'Enregistrer et terminer'}
          </Text>
          {!saving && (
            <MaterialCommunityIcons name="check" size={20} color={colors.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restartBtn}
          onPress={handleRestart}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Recommencer avec un nouveau mot"
          testID="restart-button"
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.restartBtnText}>Recommencer</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── Mode saisie
  inputCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  wordInput: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },

  instructionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },

  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },

  // ── Mode exercice
  exerciseContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  timeLabel: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  repCounter: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 80,
  },
  repLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  wordTapArea: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: spacing.md,
  },
  wordDisplay: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  stopBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  stopBtnText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // ── Mode terminé
  doneCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  doneText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryWord: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryStatItem: { alignItems: 'center', gap: 2 },
  summaryStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled: { opacity: 0.6 },

  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  restartBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
})
