import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

// ─── Données cliniques ────────────────────────────────────────────────────────
//
// Technique 5-4-3-2-1 (grounding sensoriel)
// Référence : Linehan (1993), DBT Skills Training — Techniques de tolérance à la
// détresse. Utilisée en TCC, ACT et TCD pour les états dissociatifs et crises
// d'angoisse. Grade B (consensus clinique HAS, NICE recommandations troubles anxieux).
//
// Ces consignes sont génériques et non-interprétatives (conformité MDR 2017/745).
// L'interprétation et l'adaptation appartiennent exclusivement au praticien.

interface GroundingStep {
  count: number
  sense: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  instruction: string
  tip: string
  color: string
}

const GROUNDING_STEPS: readonly GroundingStep[] = [
  {
    count: 5,
    sense: 'Voir',
    icon: 'eye-outline',
    instruction: 'Repérez 5 choses que vous voyez autour de vous.',
    tip: 'Ex. une lampe, une fenêtre, un livre, une chaise, vos mains.',
    color: '#7C3AED',
  },
  {
    count: 4,
    sense: 'Toucher',
    icon: 'hand-back-left-outline',
    instruction: 'Trouvez 4 textures ou surfaces que vous pouvez toucher.',
    tip: 'Ex. la texture de vos vêtements, le sol sous vos pieds, l\'air sur votre visage.',
    color: '#2563EB',
  },
  {
    count: 3,
    sense: 'Entendre',
    icon: 'ear-hearing',
    instruction: 'Écoutez 3 sons dans votre environnement.',
    tip: 'Ex. votre respiration, un bruit extérieur, le silence lui-même.',
    color: '#059669',
  },
  {
    count: 2,
    sense: 'Sentir',
    icon: 'flower-tulip-outline',
    instruction: 'Repérez 2 odeurs autour de vous.',
    tip: 'Ex. l\'air ambiant, votre peau, un tissu. Si rien, imaginez une odeur apaisante.',
    color: '#D97706',
  },
  {
    count: 1,
    sense: 'Goûter',
    icon: 'tongue',
    instruction: 'Prenez conscience d\'1 goût dans votre bouche.',
    tip: 'Ex. le goût de votre salive, d\'une boisson ou d\'un aliment récent.',
    color: '#DC2626',
  },
] as const

type Mode = 'intro' | 'guided' | 'done'

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function GroundingScreen() {
  const { isTeenMode, tt, teenColor } = useTeen()
  const [mode, setMode] = useState<Mode>('intro')
  const [currentStep, setCurrentStep] = useState(0)

  const step = GROUNDING_STEPS[currentStep]

  function handleStart() {
    setCurrentStep(0)
    setMode('guided')
  }

  function handleNext() {
    if (currentStep < GROUNDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setMode('done')
    }
  }

  function handleRestart() {
    setCurrentStep(0)
    setMode('intro')
  }

  // ── Mode intro ───────────────────────────────────────────────────────────────

  if (mode === 'intro') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <TeenAccent color={teenColor('grounding')} />
        <ScrollView contentContainerStyle={styles.container}>

          {/* Introduction */}
          <View style={styles.introCard} testID="intro-card">
            <MaterialCommunityIcons name="hand-heart-outline" size={40} color={colors.primary} />
            <Text style={styles.introTitle}>
              {tt('grounding', 'title') || 'Technique 5-4-3-2-1'}
            </Text>
            <Text style={styles.introText}>
              {isTeenMode
                ? tt('grounding', 'intro')
                : "Cet exercice guide votre attention vers vos cinq sens, l'un après l'autre, pour vous aider à revenir dans le moment présent."}
            </Text>
            {!isTeenMode && (
              <Text style={styles.introText}>
                Utilisez-le quand vous ressentez une forte anxiété, des pensées envahissantes
                ou une sensation de décalage par rapport à votre environnement.
              </Text>
            )}
          </View>

          {/* Aperçu des étapes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Les 5 étapes</Text>
            <View style={styles.stepsPreviewCard} testID="steps-preview">
              {GROUNDING_STEPS.map((s) => (
                <View key={s.count} style={styles.previewRow}>
                  <View style={[styles.previewBadge, { backgroundColor: s.color + '1A' }]}>
                    <Text style={[styles.previewCount, { color: s.color }]}>{s.count}</Text>
                  </View>
                  <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                  <Text style={styles.previewSense}>{s.sense}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Note clinique */}
          <View style={styles.noteCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
            <Text style={styles.noteText}>
              Exercice reconnu et validé pour gérer l'anxiété intense.
            </Text>
          </View>

          {/* Bouton démarrer */}
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Commencer l'exercice de grounding"
            testID="start-button"
          >
            <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.white} />
            <Text style={styles.startBtnText}>Commencer l'exercice</Text>
          </TouchableOpacity>

          {/* Urgences */}
          <SafetySection />

        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── Mode guidé ───────────────────────────────────────────────────────────────

  if (mode === 'guided') {
    const isLast = currentStep === GROUNDING_STEPS.length - 1
    const progress = (currentStep + 1) / GROUNDING_STEPS.length

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.guidedContainer} testID="guided-mode">

          {/* Barre de progression */}
          <View style={styles.progressBar} testID="progress-bar">
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: step.color }]} />
          </View>
          <Text style={styles.progressLabel}>
            Étape {currentStep + 1} sur {GROUNDING_STEPS.length}
          </Text>

          {/* Carte de l'étape */}
          <View style={[styles.stepCard, { borderTopColor: step.color }]} testID={`step-card-${currentStep}`}>
            <View style={[styles.stepIconCircle, { backgroundColor: step.color + '1A' }]}>
              <MaterialCommunityIcons name={step.icon} size={48} color={step.color} />
            </View>

            <View style={[styles.stepCountBadge, { backgroundColor: step.color }]}>
              <Text style={styles.stepCountText}>{step.count}</Text>
            </View>

            <Text style={[styles.stepSense, { color: step.color }]}>{step.sense}</Text>
            <Text style={styles.stepInstruction} testID={`step-instruction-${currentStep}`}>
              {step.instruction}
            </Text>
            <Text style={styles.stepTip}>{step.tip}</Text>
          </View>

          {/* Bouton suivant / terminer */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: step.color }]}
            onPress={handleNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Terminer l\'exercice' : 'Étape suivante'}
            testID="next-button"
          >
            <Text style={styles.nextBtnText}>
              {isLast ? 'Terminer' : 'Étape suivante'}
            </Text>
            <MaterialCommunityIcons
              name={isLast ? 'check-circle-outline' : 'arrow-right'}
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleRestart}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Arrêter l'exercice"
          >
            <Text style={styles.cancelBtnText}>Arrêter</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    )
  }

  // ── Mode terminé ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.doneCard} testID="done-card">
          <MaterialCommunityIcons name="check-circle-outline" size={56} color={colors.success} />
          <Text style={styles.doneTitle}>Exercice terminé</Text>
          <Text style={styles.doneText}>
            Vous avez traversé les 5 étapes. Prenez un moment pour observer
            comment vous vous sentez maintenant.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.restartBtn}
          onPress={handleRestart}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Recommencer l'exercice"
          testID="restart-button"
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.restartBtnText}>Recommencer</Text>
        </TouchableOpacity>

        <SafetySection />

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Composant urgences ───────────────────────────────────────────────────────

function SafetySection() {
  return (
    <View style={styles.safetySection} testID="safety-section">
      <Text style={styles.safetyTitle}>En cas de détresse</Text>
      <TouchableOpacity
        style={styles.safetyBtn}
        onPress={() => Linking.openURL('tel:3114')}
        accessibilityRole="button"
        accessibilityLabel="Appeler le 3114, numéro national de prévention du suicide"
      >
        <MaterialCommunityIcons name="phone" size={18} color="#DC2626" />
        <Text style={styles.safetyBtnText}>3114 — Numéro national prévention suicide</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.safetyBtn}
        onPress={() => Linking.openURL('tel:15')}
        accessibilityRole="button"
        accessibilityLabel="Appeler le SAMU, le 15"
      >
        <MaterialCommunityIcons name="ambulance" size={18} color="#DC2626" />
        <Text style={styles.safetyBtnText}>15 — SAMU</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── Intro
  introCard: {
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
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  introText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ── Section
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Aperçu étapes
  stepsPreviewCard: {
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
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewSense: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },

  // ── Note
  noteCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // ── Bouton démarrer
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },

  // ── Mode guidé
  guidedContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  stepIconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCountBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  stepSense: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepInstruction: {
    fontSize: 17,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  stepTip: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // ── Bouton suivant
  nextBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    fontSize: 14,
    color: colors.textMuted,
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

  // ── Urgences
  safetySection: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  safetyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  safetyBtnText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
})
