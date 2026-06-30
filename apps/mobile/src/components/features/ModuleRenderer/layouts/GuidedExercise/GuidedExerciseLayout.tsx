// ─── Layout `guided_exercise` — exercice guidé pas à pas (interactif) ────────
//
// Machine d'état à 3 modes : intro (présentation + aperçu des étapes) →
// guided (une étape à la fois, barre de progression) → done (écran de fin).
// Les étapes proviennent des `section_id` ; les libellés d'UI d'un field
// `exercise_config`. Aucune persistance — exercice volatil.
// Conformité MDR 2017/745 : guidage de contenu éditorial, zéro interprétation.

import { useState, useCallback, type ComponentProps } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import type { ContentField } from '@services/moduleService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { ExerciseSafetySection } from '../shared'
import { styles } from './styles'

export interface GuidedExerciseLayoutProps {
  /** Étapes regroupées par `section_id`. */
  sections: Map<string, ContentField[]>
  /** Fields hors section (config, intro, sécurité). */
  uiFields: ContentField[]
  /** Note de bas de page optionnelle. */
  footer: ContentField | undefined
  /** Couleur d'accent (teen mode / thème module). */
  accentColor?: string
}

export function GuidedExerciseLayout({ sections, uiFields, footer, accentColor }: GuidedExerciseLayoutProps) {
  const t = useModuleTranslation()
  const [mode, setMode] = useState<'intro' | 'guided' | 'done'>('intro')
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [...sections.entries()]
  const total = steps.length

  const handleStart = useCallback(() => { setCurrentStep(0); setMode('guided') }, [])
  const handleNext = useCallback(() => {
    if (currentStep < total - 1) {
      setCurrentStep(p => p + 1)
    } else {
      setMode('done')
    }
  }, [currentStep, total])
  const handleRestart = useCallback(() => { setCurrentStep(0); setMode('intro') }, [])

  const configField = uiFields.find(f => f.field_type === 'exercise_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const titleLabel = lbl('title')
  const introTextFields = [...uiFields]
    .filter(f => f.field_type === 'exercise_intro')
    .sort((a, b) => a.sort_order - b.sort_order)
  const startLabel  = lbl('start_btn') || t('common.start_exercise')
  const nextLabel   = lbl('next_btn') || t('common.continue')
  const finishLabel = lbl('finish_btn') || t('common.stop')
  const stopLabel   = lbl('stop_btn') || t('common.cancel')
  const doneText    = lbl('done_text')

  // Current step fields
  const [, currentFields = []] = steps[currentStep] ?? []
  const stepTitleField = currentFields.find(f => f.field_type === 'step_title')
  const stepHintFields = [...currentFields]
    .filter(f => f.field_type === 'step_hint')
    .sort((a, b) => a.sort_order - b.sort_order)
  const stepInstructionField = stepHintFields[0]
  const stepTipField = stepHintFields[1]

  const stepColor  = stepTitleField?.props['color'] ?? accentColor ?? colors.primary
  const stepIcon   = (stepTitleField?.props['icon'] ?? 'hand-heart-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
  const stepNumber = stepTitleField?.props['step_number'] ?? String(currentStep + 1)
  const isLast = currentStep === total - 1
  const progress = total > 0 ? (currentStep + 1) / total : 0

  const stepProgressText = t('common.exercise_step_of')
    .replace('{{current}}', String(currentStep + 1))
    .replace('{{total}}', String(total))

  // ── Intro mode
  if (mode === 'intro') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="hand-heart-outline" size={40} color={accentColor ?? colors.primary} />
          {titleLabel !== '' && (
            <Text style={styles.introTitle}>{titleLabel}</Text>
          )}
          {introTextFields.map(f => (
            <Text key={f.id} style={styles.introText}>{t(f.text_code ?? '')}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('common.exercise_steps_overview')}</Text>
          <View style={styles.stepsPreviewCard}>
            {steps.map(([, sFields]) => {
              const tf = sFields.find(f => f.field_type === 'step_title')
              if (tf == null) return null
              const color = tf.props['color'] ?? accentColor ?? colors.primary
              const icon = (tf.props['icon'] ?? 'help-circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
              const num = tf.props['step_number'] ?? ''
              return (
                <View key={tf.id} style={styles.previewRow}>
                  <View style={[styles.previewBadge, { backgroundColor: color + '1A' }]}>
                    <Text style={[styles.previewCount, { color }]}>{num}</Text>
                  </View>
                  <MaterialCommunityIcons name={icon} size={18} color={color} />
                  <Text style={styles.previewSense}>{t(tf.text_code ?? '')}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {footer != null && (
          <View style={styles.noteCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
            <Text style={styles.noteText}>{t(footer.text_code ?? '')}</Text>
          </View>
        )}

        <Pressable
          style={[styles.startBtn, accentColor != null ? { backgroundColor: accentColor } : null]}
          onPress={handleStart}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.white} />
          <Text style={styles.startBtnText}>{startLabel}</Text>
        </Pressable>

        <ExerciseSafetySection fields={uiFields} />
      </ScrollView>
    )
  }

  // ── Guided mode
  if (mode === 'guided') {
    return (
      <View style={styles.guidedContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: stepColor }]} />
        </View>
        <Text style={styles.progressLabel}>{stepProgressText}</Text>

        <View style={[styles.stepCard, { borderTopColor: stepColor }]}>
          <View style={[styles.stepIconCircle, { backgroundColor: stepColor + '1A' }]}>
            <MaterialCommunityIcons name={stepIcon} size={48} color={stepColor} />
          </View>
          <View style={[styles.stepCountBadge, { backgroundColor: stepColor }]}>
            <Text style={styles.stepCountText}>{stepNumber}</Text>
          </View>
          {stepTitleField != null && (
            <Text style={[styles.stepSense, { color: stepColor }]}>{t(stepTitleField.text_code ?? '')}</Text>
          )}
          {stepInstructionField != null && (
            <Text style={styles.stepInstruction}>{t(stepInstructionField.text_code ?? '')}</Text>
          )}
          {stepTipField != null && (
            <Text style={styles.stepTip}>{t(stepTipField.text_code ?? '')}</Text>
          )}
        </View>

        <Pressable
          style={[styles.nextBtn, { backgroundColor: stepColor }]}
          onPress={handleNext}
          accessibilityRole="button"
        >
          <Text style={styles.nextBtnText}>{isLast ? finishLabel : nextLabel}</Text>
          <MaterialCommunityIcons
            name={isLast ? 'check-circle-outline' : 'arrow-right'}
            size={20}
            color={colors.white}
          />
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={handleRestart} accessibilityRole="button">
          <Text style={styles.cancelBtnText}>{stopLabel}</Text>
        </Pressable>
      </View>
    )
  }

  // ── Done mode
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.doneCard}>
        <MaterialCommunityIcons name="check-circle-outline" size={56} color={colors.success} />
        <Text style={styles.doneTitle}>{t('common.done_title')}</Text>
        {doneText !== '' && (
          <Text style={styles.doneText}>{doneText}</Text>
        )}
      </View>

      <Pressable
        style={[styles.restartBtn, accentColor != null ? { borderColor: accentColor } : null]}
        onPress={handleRestart}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="refresh" size={20} color={accentColor ?? colors.primary} />
        <Text style={[styles.restartBtnText, accentColor != null ? { color: accentColor } : null]}>
          {t('common.restart')}
        </Text>
      </Pressable>

      <ExerciseSafetySection fields={uiFields} />
    </ScrollView>
  )
}
