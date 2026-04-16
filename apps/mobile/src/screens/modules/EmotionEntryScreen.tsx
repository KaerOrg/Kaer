import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { saveEmotionEntry, generateId } from '../../lib/database'
import {
  EMOTION_WHEEL,
  type PrimaryEmotion,
  type SecondaryEmotion,
  type SpecificEmotion,
} from '../../constants/emotionWheel'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'

type Nav = NativeStackNavigationProp<AppStackParamList>

type Step = 'primary' | 'secondary' | 'specific' | 'intensity' | 'notes'

// ─── Composant barre de progression ──────────────────────────────────────────

const STEPS: Step[] = ['primary', 'secondary', 'specific', 'intensity', 'notes']
const STEP_LABELS: Record<Step, string> = {
  primary: 'Émotion principale',
  secondary: 'Nuance',
  specific: 'Précision',
  intensity: 'Intensité',
  notes: 'Note',
}

interface ProgressBarProps {
  current: Step
  color: string
}

function ProgressBar({ current, color }: ProgressBarProps) {
  const idx = STEPS.indexOf(current)
  const progress = (idx + 1) / STEPS.length

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressLabel}>{STEP_LABELS[current]}</Text>
    </View>
  )
}

// ─── Écran de saisie ──────────────────────────────────────────────────────────

export default function EmotionEntryScreen() {
  const navigation = useNavigation<Nav>()

  const [step, setStep] = useState<Step>('primary')
  const [primary, setPrimary] = useState<PrimaryEmotion | null>(null)
  const [secondary, setSecondary] = useState<SecondaryEmotion | null>(null)
  const [specific, setSpecific] = useState<SpecificEmotion | null>(null)
  const [intensity, setIntensity] = useState<number>(5)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const activeColor = primary?.color ?? colors.primary

  // ── Navigation entre étapes ───────────────────────────────────────────────

  function handleSelectPrimary(emotion: PrimaryEmotion) {
    setPrimary(emotion)
    setSecondary(null)
    setSpecific(null)
    setStep('secondary')
  }

  function handleSelectSecondary(sec: SecondaryEmotion) {
    setSecondary(sec)
    setSpecific(null)
    setStep('specific')
  }

  function handleSelectSpecific(spec: SpecificEmotion) {
    setSpecific(spec)
    setStep('intensity')
  }

  function handleBack() {
    if (step === 'secondary') { setStep('primary'); setSecondary(null); setSpecific(null) }
    else if (step === 'specific') { setStep('secondary'); setSpecific(null) }
    else if (step === 'intensity') setStep('specific')
    else if (step === 'notes') setStep('intensity')
  }

  async function handleSave() {
    if (!primary || !secondary || !specific) return
    setSaving(true)
    try {
      await saveEmotionEntry({
        id: generateId(),
        primary_key: primary.key,
        primary_label: primary.label,
        secondary_key: secondary.key,
        secondary_label: secondary.label,
        specific_key: specific.key,
        specific_label: specific.label,
        intensity,
        notes: notes.trim() || null,
      })
      navigation.goBack()
    } finally {
      setSaving(false)
    }
  }

  // ── Rendu par étape ───────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* En-tête */}
        <View style={styles.header}>
          {step !== 'primary' && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Étape précédente"
              testID="back-button"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <ProgressBar current={step} color={activeColor} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>

          {/* ── Étape 1 : Émotion primaire ──────────────────────────────────── */}
          {step === 'primary' && (
            <View testID="step-primary">
              <Text style={styles.stepTitle}>Qu'est-ce que vous ressentez ?</Text>
              <Text style={styles.stepHint}>Choisissez l'émotion qui vous semble la plus proche.</Text>
              <View style={styles.gridContainer}>
                {EMOTION_WHEEL.map((emotion) => (
                  <TouchableOpacity
                    key={emotion.key}
                    style={[styles.primaryCard, { borderColor: emotion.color }]}
                    onPress={() => handleSelectPrimary(emotion)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={emotion.label}
                    testID={`primary-${emotion.key}`}
                  >
                    <View style={[styles.primaryIconCircle, { backgroundColor: emotion.color + '1A' }]}>
                      <MaterialCommunityIcons name={emotion.icon as never} size={28} color={emotion.color} />
                    </View>
                    <Text style={[styles.primaryLabel, { color: emotion.color }]}>{emotion.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Étape 2 : Émotion secondaire ────────────────────────────────── */}
          {step === 'secondary' && primary && (
            <View testID="step-secondary">
              <Text style={styles.stepTitle}>Quelle nuance de {primary.label.toLowerCase()} ?</Text>
              <Text style={styles.stepHint}>Choisissez l'intensité qui correspond le mieux.</Text>
              <View style={styles.listContainer}>
                {primary.secondaries.map((sec) => (
                  <TouchableOpacity
                    key={sec.key}
                    style={[styles.optionCard, { borderLeftColor: activeColor }]}
                    onPress={() => handleSelectSecondary(sec)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={sec.label}
                    testID={`secondary-${sec.key}`}
                  >
                    <Text style={[styles.optionLabel, { color: activeColor }]}>{sec.label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Étape 3 : Émotion spécifique ────────────────────────────────── */}
          {step === 'specific' && secondary && (
            <View testID="step-specific">
              <Text style={styles.stepTitle}>Quel mot vous correspond le mieux ?</Text>
              <Text style={styles.stepHint}>Précisez votre ressenti avec un terme plus exact.</Text>
              <View style={styles.listContainer}>
                {secondary.specifics.map((spec) => (
                  <TouchableOpacity
                    key={spec.key}
                    style={[styles.optionCard, { borderLeftColor: activeColor }]}
                    onPress={() => handleSelectSpecific(spec)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={spec.label}
                    testID={`specific-${spec.key}`}
                  >
                    <Text style={[styles.optionLabel, { color: activeColor }]}>{spec.label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Étape 4 : Intensité ─────────────────────────────────────────── */}
          {step === 'intensity' && specific && (
            <View testID="step-intensity">
              <Text style={styles.stepTitle}>Quelle est l'intensité de ce ressenti ?</Text>
              <Text style={styles.stepHint}>De 1 (très faible) à 10 (très fort). Valeur brute.</Text>

              <View style={styles.intensityCard}>
                <View style={[styles.intensityDisplay, { backgroundColor: activeColor + '1A' }]}>
                  <Text style={[styles.intensityValue, { color: activeColor }]} testID="intensity-value">
                    {intensity}
                  </Text>
                  <Text style={styles.intensityMax}>/10</Text>
                </View>
                <View style={styles.intensityBtns}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[
                        styles.intensityBtn,
                        intensity === v && { backgroundColor: activeColor, borderColor: activeColor },
                      ]}
                      onPress={() => setIntensity(v)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`Intensité ${v}`}
                      testID={`intensity-btn-${v}`}
                    >
                      <Text style={[
                        styles.intensityBtnText,
                        intensity === v && styles.intensityBtnTextActive,
                      ]}>
                        {v}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.continueBtn, { backgroundColor: activeColor }]}
                onPress={() => setStep('notes')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continuer vers la note"
                testID="continue-to-notes"
              >
                <Text style={styles.continueBtnText}>Continuer</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Étape 5 : Note libre ────────────────────────────────────────── */}
          {step === 'notes' && (
            <View testID="step-notes">
              <Text style={styles.stepTitle}>Une note à ajouter ? (optionnel)</Text>
              <Text style={styles.stepHint}>
                Contexte, situation, pensée associée… Ce champ est libre.
              </Text>

              {/* Récapitulatif */}
              <View style={[styles.summaryCard, { borderLeftColor: activeColor }]}>
                <Text style={[styles.summaryPrimary, { color: activeColor }]}>
                  {primary?.label} — {secondary?.label} — {specific?.label}
                </Text>
                <Text style={styles.summaryIntensity}>Intensité : {intensity}/10</Text>
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Note libre (facultatif)"
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Note libre"
                testID="notes-input"
              />

              <TouchableOpacity
                style={[styles.continueBtn, { backgroundColor: activeColor }, saving && styles.btnDisabled]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Enregistrer l'entrée"
                testID="save-button"
              >
                <Text style={styles.continueBtnText}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Text>
                {!saving && (
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── En-tête
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },

  // ── Progression
  progressContainer: { flex: 1, gap: spacing.xs },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  // ── Titres étapes
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepHint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  // ── Grille émotions primaires
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },

  // ── Liste options (secondaire / spécifique)
  listContainer: { gap: spacing.sm },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLabel: { fontSize: 16, fontWeight: '600' },

  // ── Intensité
  intensityCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.md,
  },
  intensityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  intensityValue: { fontSize: 48, fontWeight: '800' },
  intensityMax: { fontSize: 20, color: colors.textMuted, fontWeight: '600' },
  intensityBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  intensityBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  intensityBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  intensityBtnTextActive: { color: colors.white },

  // ── Résumé (étape notes)
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryPrimary: { fontSize: 15, fontWeight: '700' },
  summaryIntensity: { fontSize: 13, color: colors.textMuted },

  // ── Note libre
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  // ── Bouton continuer / enregistrer
  continueBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled: { opacity: 0.6 },
})
