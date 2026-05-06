import React, { useState, useCallback, useEffect, useMemo, useRef, ComponentType } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, TextInput, Alert, ActivityIndicator, Vibration, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { logger } from '@psytool/shared'
import { colors, spacing, radius } from '../../theme'
import type { ContentField } from '../../lib/moduleService'
import { getAllPlanItemsForModule, savePlanItem, deletePlanItem, generateId, type PlanItem, getAllCognitiveSaturationSessions, saveCognitiveSaturationSession, deleteCognitiveSaturationSession, type CognitiveSaturationSession } from '../../lib/database'
import { formatDateTime } from '../../lib/dateUtils'
import { useTeen } from '../../hooks/useTeen'
import { LikertWidget, type LikertOption } from './fields/widgets/LikertWidget'
import {
  type FieldProps,
  CardDefinition,
  FieldListItem,
  FieldRow,
  FieldText,
} from './fields'

// ─── Registry ────────────────────────────────────────────────────────────────

function CardDivider() { return <View style={styles.divider} /> }

const FIELD_REGISTRY: Record<string, ComponentType<FieldProps>> = {
  card_callout:        FieldText,
  card_definition:     CardDefinition,
  card_divider:        CardDivider,
  card_heading_2:      FieldText,
  card_heading_3:      FieldText,
  card_heading_4:      FieldText,
  card_list_item:      FieldListItem,
  card_numbered_item:  FieldListItem,
  card_paragraph:      FieldText,
}

function renderField(f: ContentField, t: (key: string) => string): React.ReactNode {
  const Component = FIELD_REGISTRY[f.field_type]
  if (!Component) {
    logger.warn(`[ModuleRenderer] field_type non géré : "${f.field_type}"`)
    return null
  }
  return <Component key={f.id} field={f} t={t} />
}

// ─── List rendering ───────────────────────────────────────────────────────────

function renderCardBodyFields(
  fields: ContentField[],
  t: (key: string) => string,
): React.ReactNode {
  const result: React.ReactNode[] = []
  let listBuffer: ContentField[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listBuffer.length === 0) return
    result.push(
      <View key={`list-${listBuffer[0].id}`} style={styles.listBlock}>
        {listBuffer.map(f => renderField(f, t))}
      </View>
    )
    listBuffer = []
    listType = null
  }

  for (const f of fields) {
    if (f.field_type === 'card_list_item') {
      if (listType === 'ol') flushList()
      listType = 'ul'
      listBuffer.push(f)
    } else if (f.field_type === 'card_numbered_item') {
      if (listType === 'ul') flushList()
      listType = 'ol'
      listBuffer.push(f)
    } else {
      flushList()
      result.push(renderField(f, t))
    }
  }
  flushList()
  return result
}

// ─── Layouts — preview (read-only) ───────────────────────────────────────────

function StepsLayout({ sections, footer, t }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  return (
    <View style={styles.stepsContainer}>
      {[...sections.entries()].map(([sectionId, fields], idx) => {
        const titleField = fields.find(f => f.field_type === 'step_title')
        const hintField = fields.find(f => f.field_type === 'step_hint')
        if (!titleField) return null
        const color = titleField.props['color'] ?? '#6366F1'
        const num = titleField.props['step_number'] ?? String(idx + 1)
        return (
          <View key={sectionId} style={styles.stepRow}>
            <View style={[styles.stepBadge, { backgroundColor: color }]}>
              <Text style={styles.stepNum}>{num}</Text>
            </View>
            <View style={styles.stepContent}>
              <FieldText field={titleField} t={t} />
              {hintField && <FieldText field={hintField} t={t} />}
            </View>
          </View>
        )
      })}
      {footer && <FieldText field={footer} t={t} />}
    </View>
  )
}

function FieldsLayout({ fields, footer, t }: {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  return (
    <View>
      <View style={styles.fieldsBlock}>
        {fields.map(f => <FieldRow key={f.id} field={f} t={t} />)}
      </View>
      {footer && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <FieldText field={footer} t={t} />
        </View>
      )}
    </View>
  )
}

function Grid2x2Layout({ sections, footer, t }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
  t: (key: string) => string
}) {
  const entries = [...sections.entries()]
  return (
    <View>
      <View style={styles.grid}>
        {entries.map(([sectionId, fields]) => {
          const titleField = fields.find(f => f.field_type === 'quadrant_title')
          const subtitleField = fields.find(f => f.field_type === 'quadrant_subtitle')
          const color = titleField?.props['color'] ?? '#6366F1'
          return (
            <View key={sectionId} style={[styles.quadrant, { borderTopColor: color, borderTopWidth: 3 }]}>
              {titleField && <FieldText field={titleField} t={t} />}
              {subtitleField && <FieldText field={subtitleField} t={t} />}
            </View>
          )
        })}
      </View>
      {footer && <FieldText field={footer} t={t} />}
    </View>
  )
}

function CardsLayout({ sections, t }: {
  sections: Map<string, ContentField[]>
  t: (key: string) => string
}) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const handleToggle = useCallback((id: string) => {
    setExpandedCard(prev => (prev === id ? null : id))
  }, [])

  return (
    <View style={styles.cardsBlock}>
      {[...sections.entries()].map(([sectionId, fields]) => {
        const titleField = fields.find(f => f.field_type === 'card_title')
        const summaryField = fields.find(f => f.field_type === 'card_summary')
        const bodyFields = fields.filter(
          f => f.field_type !== 'card_title' && f.field_type !== 'card_summary'
        )
        const isOpen = expandedCard === sectionId

        return (
          <View key={sectionId} style={styles.card}>
            <Pressable
              style={styles.cardHeader}
              onPress={() => handleToggle(sectionId)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={titleField ? t(titleField.text_code ?? '') : sectionId}
            >
              <View style={styles.cardMeta}>
                {titleField
                  ? <FieldText field={titleField} t={t} />
                  : <Text style={styles.cardFallbackTitle}>{sectionId}</Text>
                }
                {summaryField && <FieldText field={summaryField} t={t} />}
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            {isOpen && bodyFields.length > 0 && (
              <View style={styles.cardBody}>
                {renderCardBodyFields(bodyFields, t)}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

// ─── Layout — questionnaire interactif (patient) ──────────────────────────────

function QuestionnaireLayout({ fields, answers, onAnswer, textInputValues, onTextInput, accentColor, t }: {
  fields: ContentField[]
  answers: (number | null)[]
  onAnswer: (index: number, value: number) => void
  textInputValues?: Record<string, string>
  onTextInput?: (fieldId: string, value: string) => void
  accentColor?: string
  t: (key: string) => string
}) {
  const instructions = fields
    .filter(f => f.field_type === 'scale_instruction')
    .sort((a, b) => a.sort_order - b.sort_order)

  const options: LikertOption[] = fields
    .filter(f => f.field_type === 'scale_option')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({ value: parseInt(f.props['value'] ?? '0', 10), label: t(f.text_code ?? '') }))

  const legendItems = fields
    .filter(f => f.field_type === 'scale_legend_item')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({ value: parseInt(f.props['value'] ?? '0', 10), label: t(f.text_code ?? '') }))

  const warning = fields.find(f => f.field_type === 'scale_warning')
  const footer = fields.find(f => f.field_type === 'footer_note')

  const allQuestions = fields
    .filter(f => f.field_type === 'scale_question' || f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)

  const questionIndexMap = new Map(allQuestions.map((q, i) => [q.id, i]))

  const contentItems = fields
    .filter(f => f.field_type === 'scale_section' || f.field_type === 'scale_question' || f.field_type === 'scale_slider_question')
    .sort((a, b) => a.sort_order - b.sort_order)

  const extraFields = fields
    .filter(f => f.field_type === 'scale_number_input' || f.field_type === 'scale_text_input')
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <View style={styles.questionnaireContainer}>
      {/* Instructions */}
      {instructions.length > 0 && (
        <View style={styles.instructionBlock}>
          {instructions.map(f => (
            <Text key={f.id} style={styles.instructionText}>{t(f.text_code ?? '')}</Text>
          ))}
          {legendItems.length > 0 && (
            <View style={styles.legendRow}>
              {legendItems.map(item => (
                <View key={item.value} style={styles.legendItem}>
                  <Text style={styles.legendNum}>{item.value}</Text>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Warning hétéro-évaluation */}
      {warning != null && (
        <View style={styles.warningBlock}>
          <Ionicons name="alert-circle-outline" size={16} color="#92400E" />
          <Text style={styles.warningText}>{t(warning.text_code ?? '')}</Text>
        </View>
      )}

      {/* Questions avec séparateurs de section */}
      <View style={styles.questionsBlock}>
        {contentItems.map(f => {
          if (f.field_type === 'scale_section') {
            return (
              <View key={f.id} style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t(f.text_code ?? '')}</Text>
              </View>
            )
          }
          const qIndex = questionIndexMap.get(f.id)
          if (qIndex === undefined) return null

          if (f.field_type === 'scale_slider_question') {
            const min = parseInt((f.props['min'] as string | undefined) ?? '1', 10)
            const max = parseInt((f.props['max'] as string | undefined) ?? '10', 10)
            const color = (f.props['color'] as string | undefined) ?? colors.primary
            const icon = (f.props['icon'] as string | undefined) as React.ComponentProps<typeof MaterialCommunityIcons>['name'] | undefined
            const lowHintCode = f.props['low_hint_code'] as string | undefined
            const highHintCode = f.props['high_hint_code'] as string | undefined
            const selectedValue = answers[qIndex] ?? null
            const pips = Array.from({ length: max - min + 1 }, (_, i) => min + i)
            return (
              <View key={f.id} style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                  <View style={styles.sliderLabelRow}>
                    {icon != null && <MaterialCommunityIcons name={icon} size={18} color={color} />}
                    <Text style={[styles.sliderLabel, { color }]}>{t(f.text_code ?? '')}</Text>
                  </View>
                  {selectedValue !== null && (
                    <Text style={[styles.sliderValue, { color }]}>{selectedValue}</Text>
                  )}
                </View>
                <View style={styles.sliderPips}>
                  {pips.map(n => {
                    const selected = n === selectedValue
                    return (
                      <Pressable
                        key={n}
                        style={[
                          styles.sliderPip,
                          selectedValue !== null && n <= selectedValue && { backgroundColor: color + '33' },
                          selected && { backgroundColor: color, borderColor: color },
                        ]}
                        onPress={() => onAnswer(qIndex, n)}
                        hitSlop={4}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`${t(f.text_code ?? '')} : ${n}`}
                      >
                        <Text style={[styles.sliderPipText, selected && styles.sliderPipTextSelected]}>
                          {n}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                {(lowHintCode != null || highHintCode != null) && (
                  <View style={styles.sliderHints}>
                    <Text style={styles.sliderHint}>{lowHintCode != null ? t(lowHintCode) : ''}</Text>
                    <Text style={styles.sliderHint}>{highHintCode != null ? t(highHintCode) : ''}</Text>
                  </View>
                )}
              </View>
            )
          }

          const questionOptions = f.children
            .filter(c => c.field_type === 'scale_option')
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(c => ({ value: parseInt(c.props['value'] ?? '0', 10), label: t(c.text_code ?? '') }))
          const finalOptions = questionOptions.length > 0 ? questionOptions : options
          return (
            <View key={f.id} style={styles.questionCard}>
              <Text style={styles.questionText}>
                <Text style={styles.questionNum}>{qIndex + 1}{'.'}{' '}</Text>
                {t(f.text_code ?? '')}
              </Text>
              <LikertWidget
                options={finalOptions}
                selected={answers[qIndex] ?? null}
                onSelect={v => onAnswer(qIndex, v)}
                accentColor={accentColor}
              />
            </View>
          )
        })}
      </View>

      {/* Champs complémentaires optionnels (scale_number_input / scale_text_input) */}
      {extraFields.length > 0 && (
        <View style={styles.supplementaryBlock}>
          <Text style={styles.supplementaryTitle}>{t('common.optional_info_label')}</Text>
          {extraFields.map(f => {
            if (f.field_type === 'scale_number_input') {
              return (
                <View key={f.id} style={styles.extraCard}>
                  {f.text_code ? (
                    <Text style={styles.extraLabel}>{t(f.text_code)}</Text>
                  ) : null}
                  <View style={styles.numberInputRow}>
                    <TextInput
                      style={styles.numberInput}
                      value={textInputValues?.[f.id] ?? ''}
                      onChangeText={v => onTextInput?.(f.id, v)}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel={f.text_code ? t(f.text_code) : undefined}
                    />
                    {f.props['unit'] ? (
                      <Text style={styles.numberInputUnit}>{f.props['unit'] as string}</Text>
                    ) : null}
                  </View>
                </View>
              )
            }
            if (f.field_type === 'scale_text_input') {
              const placeholderCode = f.props['placeholder_code'] as string | undefined
              return (
                <View key={f.id} style={styles.extraCard}>
                  {f.text_code ? (
                    <Text style={styles.extraLabel}>{t(f.text_code)}</Text>
                  ) : null}
                  <TextInput
                    style={styles.textInput}
                    value={textInputValues?.[f.id] ?? ''}
                    onChangeText={v => onTextInput?.(f.id, v)}
                    placeholder={placeholderCode ? t(placeholderCode) : undefined}
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={f.text_code ? t(f.text_code) : undefined}
                  />
                </View>
              )
            }
            return null
          })}
        </View>
      )}

      {/* Note de bas de page MDR */}
      {footer != null && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
        </View>
      )}
    </View>
  )
}

// ─── Layout — exercice guidé interactif ──────────────────────────────────────

function ExerciseSafetySection({ fields, t }: { fields: ContentField[]; t: (key: string) => string }) {
  const titleField = fields.find(f => f.field_type === 'exercise_safety_title')
  const phoneFields = [...fields]
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)
  if (titleField == null && phoneFields.length === 0) return null
  return (
    <View style={gStyles.safetySection}>
      {titleField != null && (
        <Text style={gStyles.safetyTitle}>{t(titleField.text_code ?? '')}</Text>
      )}
      {phoneFields.map(f => {
        const phone = f.props['phone'] ?? ''
        const icon = (f.props['icon'] ?? 'phone') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
        return (
          <Pressable
            key={f.id}
            style={gStyles.safetyBtn}
            onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name={icon} size={18} color="#DC2626" />
            <Text style={gStyles.safetyBtnText}>{t(f.text_code ?? '')}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function GuidedExerciseLayout({ sections, uiFields, footer, t, accentColor }: {
  sections: Map<string, ContentField[]>
  uiFields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
  accentColor?: string
}) {
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

  // UI text fields (all module-specific, driven from DB text_codes)
  const titleField = uiFields.find(f => f.field_type === 'exercise_title')
  const introTextFields = [...uiFields]
    .filter(f => f.field_type === 'exercise_intro')
    .sort((a, b) => a.sort_order - b.sort_order)
  const startLabel  = t(uiFields.find(f => f.field_type === 'exercise_start_btn')?.text_code ?? 'common.start_exercise')
  const nextLabel   = t(uiFields.find(f => f.field_type === 'exercise_next_btn')?.text_code ?? 'common.continue')
  const finishLabel = t(uiFields.find(f => f.field_type === 'exercise_finish_btn')?.text_code ?? 'common.stop')
  const stopLabel   = t(uiFields.find(f => f.field_type === 'exercise_stop_btn')?.text_code ?? 'common.cancel')
  const doneTextField = uiFields.find(f => f.field_type === 'exercise_done_text')

  // Current step fields
  const [, currentFields = []] = steps[currentStep] ?? []
  const stepTitleField = currentFields.find(f => f.field_type === 'step_title')
  const stepHintFields = [...currentFields]
    .filter(f => f.field_type === 'step_hint')
    .sort((a, b) => a.sort_order - b.sort_order)
  const stepInstructionField = stepHintFields[0]
  const stepTipField = stepHintFields[1]

  const stepColor  = stepTitleField?.props['color'] ?? accentColor ?? colors.primary
  const stepIcon   = (stepTitleField?.props['icon'] ?? 'hand-heart-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
  const stepNumber = stepTitleField?.props['step_number'] ?? String(currentStep + 1)
  const isLast = currentStep === total - 1
  const progress = total > 0 ? (currentStep + 1) / total : 0

  const stepProgressText = t('common.exercise_step_of')
    .replace('{{current}}', String(currentStep + 1))
    .replace('{{total}}', String(total))

  // ── Intro mode
  if (mode === 'intro') {
    return (
      <ScrollView contentContainerStyle={gStyles.container}>
        <View style={gStyles.introCard}>
          <MaterialCommunityIcons name="hand-heart-outline" size={40} color={accentColor ?? colors.primary} />
          {titleField != null && (
            <Text style={gStyles.introTitle}>{t(titleField.text_code ?? '')}</Text>
          )}
          {introTextFields.map(f => (
            <Text key={f.id} style={gStyles.introText}>{t(f.text_code ?? '')}</Text>
          ))}
        </View>

        <View style={gStyles.section}>
          <Text style={gStyles.sectionLabel}>{t('common.exercise_steps_overview')}</Text>
          <View style={gStyles.stepsPreviewCard}>
            {steps.map(([, sFields]) => {
              const tf = sFields.find(f => f.field_type === 'step_title')
              if (tf == null) return null
              const color = tf.props['color'] ?? accentColor ?? colors.primary
              const icon = (tf.props['icon'] ?? 'help-circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
              const num = tf.props['step_number'] ?? ''
              return (
                <View key={tf.id} style={gStyles.previewRow}>
                  <View style={[gStyles.previewBadge, { backgroundColor: color + '1A' }]}>
                    <Text style={[gStyles.previewCount, { color }]}>{num}</Text>
                  </View>
                  <MaterialCommunityIcons name={icon} size={18} color={color} />
                  <Text style={gStyles.previewSense}>{t(tf.text_code ?? '')}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {footer != null && (
          <View style={gStyles.noteCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
            <Text style={gStyles.noteText}>{t(footer.text_code ?? '')}</Text>
          </View>
        )}

        <Pressable
          style={[gStyles.startBtn, accentColor != null ? { backgroundColor: accentColor } : null]}
          onPress={handleStart}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.white} />
          <Text style={gStyles.startBtnText}>{startLabel}</Text>
        </Pressable>

        <ExerciseSafetySection fields={uiFields} t={t} />
      </ScrollView>
    )
  }

  // ── Guided mode
  if (mode === 'guided') {
    return (
      <View style={gStyles.guidedContainer}>
        <View style={gStyles.progressBar}>
          <View style={[gStyles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: stepColor }]} />
        </View>
        <Text style={gStyles.progressLabel}>{stepProgressText}</Text>

        <View style={[gStyles.stepCard, { borderTopColor: stepColor }]}>
          <View style={[gStyles.stepIconCircle, { backgroundColor: stepColor + '1A' }]}>
            <MaterialCommunityIcons name={stepIcon} size={48} color={stepColor} />
          </View>
          <View style={[gStyles.stepCountBadge, { backgroundColor: stepColor }]}>
            <Text style={gStyles.stepCountText}>{stepNumber}</Text>
          </View>
          {stepTitleField != null && (
            <Text style={[gStyles.stepSense, { color: stepColor }]}>{t(stepTitleField.text_code ?? '')}</Text>
          )}
          {stepInstructionField != null && (
            <Text style={gStyles.stepInstruction}>{t(stepInstructionField.text_code ?? '')}</Text>
          )}
          {stepTipField != null && (
            <Text style={gStyles.stepTip}>{t(stepTipField.text_code ?? '')}</Text>
          )}
        </View>

        <Pressable
          style={[gStyles.nextBtn, { backgroundColor: stepColor }]}
          onPress={handleNext}
          accessibilityRole="button"
        >
          <Text style={gStyles.nextBtnText}>{isLast ? finishLabel : nextLabel}</Text>
          <MaterialCommunityIcons
            name={isLast ? 'check-circle-outline' : 'arrow-right'}
            size={20}
            color={colors.white}
          />
        </Pressable>

        <Pressable style={gStyles.cancelBtn} onPress={handleRestart} accessibilityRole="button">
          <Text style={gStyles.cancelBtnText}>{stopLabel}</Text>
        </Pressable>
      </View>
    )
  }

  // ── Done mode
  return (
    <ScrollView contentContainerStyle={gStyles.container}>
      <View style={gStyles.doneCard}>
        <MaterialCommunityIcons name="check-circle-outline" size={56} color={colors.success} />
        <Text style={gStyles.doneTitle}>{t('common.done_title')}</Text>
        {doneTextField != null && (
          <Text style={gStyles.doneText}>{t(doneTextField.text_code ?? '')}</Text>
        )}
      </View>

      <Pressable
        style={[gStyles.restartBtn, accentColor != null ? { borderColor: accentColor } : null]}
        onPress={handleRestart}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="refresh" size={20} color={accentColor ?? colors.primary} />
        <Text style={[gStyles.restartBtnText, accentColor != null ? { color: accentColor } : null]}>
          {t('common.restart')}
        </Text>
      </Pressable>

      <ExerciseSafetySection fields={uiFields} t={t} />
    </ScrollView>
  )
}

// ─── Layout — patient_scenario (per-patient config) ─────────────────────────

function PatientScenarioLayout({ fields, patientConfig, t }: {
  fields: ContentField[]
  patientConfig: Record<string, unknown> | null
  t: (key: string) => string
}) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [activeSound, setActiveSound] = useState<string | null>(null)

  const alternativeScenario = typeof patientConfig?.alternative_scenario === 'string'
    ? patientConfig.alternative_scenario
    : null
  const originalScenario = typeof patientConfig?.original_scenario === 'string'
    ? patientConfig.original_scenario
    : null

  const disclaimerField = fields.find(f => f.field_type === 'rim_disclaimer')
  const stepFields = [...fields]
    .filter(f => f.field_type === 'rim_step')
    .sort((a, b) => a.sort_order - b.sort_order)
  const soundFields = [...fields]
    .filter(f => f.field_type === 'ambient_sound')
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!alternativeScenario) {
    return (
      <View style={psStyles.emptyCenter}>
        <MaterialCommunityIcons name="playlist-edit" size={52} color={colors.border} />
        <Text style={psStyles.emptyTitle}>{t('modules.rim.empty_title')}</Text>
        <Text style={psStyles.emptyText}>{t('modules.rim.empty_text')}</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={psStyles.container}>
      {disclaimerField != null && (
        <View style={psStyles.warningCard} testID="rim-disclaimer">
          <MaterialCommunityIcons name="shield-account-outline" size={20} color="#B45309" />
          <Text style={psStyles.warningText}>{t(disclaimerField.text_code ?? '')}</Text>
        </View>
      )}

      <View style={psStyles.section}>
        <Text style={psStyles.sectionLabel}>{t('modules.rim.section_scenario')}</Text>
        <View style={psStyles.scenarioCard} testID="alternative-scenario-card">
          <MaterialCommunityIcons name="script-text-outline" size={18} color={colors.primary} style={psStyles.scenarioIcon} />
          <Text style={psStyles.scenarioText} testID="alternative-scenario-text">
            {alternativeScenario}
          </Text>
        </View>
      </View>

      {stepFields.length > 0 && (
        <View style={psStyles.section}>
          <Text style={psStyles.sectionLabel}>{t('modules.rim.intro')}</Text>
          <View style={psStyles.stepsCard} testID="protocol-steps">
            {stepFields.map((f, i) => (
              <View key={f.id} style={psStyles.stepRow}>
                <View style={psStyles.stepBadge}>
                  <Text style={psStyles.stepBadgeText}>
                    {String(f.props['step_number'] ?? i + 1)}
                  </Text>
                </View>
                <Text style={psStyles.stepText}>{t(f.text_code ?? '')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {originalScenario != null && (
        <View style={psStyles.section}>
          <Pressable
            style={psStyles.collapsibleHeader}
            onPress={() => setShowOriginal(prev => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showOriginal ? t('modules.rim.hide_original') : t('modules.rim.show_original')}
          >
            <Text style={psStyles.collapsibleLabel}>{t('modules.rim.section_original')}</Text>
            <MaterialCommunityIcons
              name={showOriginal ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          {showOriginal && (
            <View style={psStyles.originalCard} testID="original-scenario-card">
              <Text style={psStyles.originalText}>{originalScenario}</Text>
            </View>
          )}
        </View>
      )}

      {soundFields.length > 0 && (
        <View style={psStyles.section}>
          <Text style={psStyles.sectionLabel}>{t('modules.rim.section_sounds')}</Text>
          <Text style={psStyles.sectionHint}>{t('modules.rim.sounds_hint')}</Text>
          <View style={psStyles.soundsGrid}>
            {soundFields.map(f => {
              const available = f.props['available'] === 'true'
              const soundKey = String(f.props['key'] ?? f.id)
              const icon = (f.props['icon'] ?? 'music') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
              return (
                <Pressable
                  key={f.id}
                  style={[
                    psStyles.soundBtn,
                    activeSound === soundKey ? psStyles.soundBtnActive : null,
                    !available ? psStyles.soundBtnUnavailable : null,
                  ]}
                  onPress={() => {
                    if (available) setActiveSound(prev => prev === soundKey ? null : soundKey)
                  }}
                  accessibilityLabel={t(f.text_code ?? '')}
                  accessibilityState={{ disabled: !available }}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={22}
                    color={!available ? colors.border : activeSound === soundKey ? colors.white : colors.primary}
                  />
                  <Text style={[
                    psStyles.soundLabel,
                    !available ? psStyles.soundLabelMuted : null,
                    activeSound === soundKey ? psStyles.soundLabelActive : null,
                  ]}>
                    {t(f.text_code ?? '')}
                  </Text>
                  {!available && (
                    <Text style={psStyles.soundComingSoon}>{t('common.coming_soon')}</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      <ExerciseSafetySection fields={fields} t={t} />
    </ScrollView>
  )
}

// ─── Layout — plan éditable (crisis_plan…) ────────────────────────────────────

function EditableStepsLayout({ sections, uiFields, moduleId, t }: {
  sections: Map<string, ContentField[]>
  uiFields: ContentField[]
  moduleId: string
  t: (key: string) => string
}) {
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<string>>(new Set())
  const [addingToSection, setAddingToSection] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    getAllPlanItemsForModule(moduleId).then(data => {
      setItems(data)
      setLoading(false)
    })
  }, [moduleId])

  const itemsBySection = useMemo(() => {
    const map = new Map<string, PlanItem[]>()
    for (const item of items) {
      const list = map.get(item.section_id) ?? []
      list.push(item)
      map.set(item.section_id, list)
    }
    return map
  }, [items])

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
        setAddingToSection(curr => (curr === sectionId ? null : curr))
      } else {
        next.add(sectionId)
      }
      return next
    })
  }, [])

  const handleStartAdd = useCallback((sectionId: string) => {
    setAddingToSection(sectionId)
    setNewItemText('')
    setEditingId(null)
  }, [])

  const handleCancelAdd = useCallback(() => {
    setAddingToSection(null)
    setNewItemText('')
  }, [])

  const handleSaveNew = useCallback(async (sectionId: string) => {
    const trimmed = newItemText.trim()
    if (!trimmed) return
    const existingItems = itemsBySection.get(sectionId) ?? []
    const newItem = {
      id: generateId(),
      module_id: moduleId,
      section_id: sectionId,
      text: trimmed,
      sort_order: existingItems.length,
    }
    await savePlanItem(newItem)
    setItems(prev => [...prev, { ...newItem, created_at: new Date().toISOString() }])
    setAddingToSection(null)
    setNewItemText('')
  }, [newItemText, itemsBySection, moduleId])

  const handleStartEdit = useCallback((item: PlanItem) => {
    setEditingId(item.id)
    setEditText(item.text)
    setAddingToSection(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const handleSaveEdit = useCallback(async (item: PlanItem) => {
    const trimmed = editText.trim()
    if (!trimmed) return
    await savePlanItem({ id: item.id, module_id: item.module_id, section_id: item.section_id, text: trimmed, sort_order: item.sort_order })
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, text: trimmed } : i)))
    setEditingId(null)
    setEditText('')
  }, [editText])

  const handleDelete = useCallback((item: PlanItem) => {
    Alert.alert(t('modules.crisis_plan.delete_item_title'), `"${item.text}"`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          await deletePlanItem(item.id)
          setItems(prev => prev.filter(i => i.id !== item.id))
        },
      },
    ])
  }, [t])

  const emergencyFields = uiFields
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)

  if (loading) {
    return <View style={esStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  return (
    <View style={esStyles.container}>
      <ScrollView style={esStyles.scroll} contentContainerStyle={esStyles.scrollContent} keyboardShouldPersistTaps="handled">
        {[...sections.entries()].map(([sectionId, fields], idx) => {
          const titleField = fields.find(f => f.field_type === 'step_title')
          const hintField = fields.find(f => f.field_type === 'step_hint')
          if (!titleField) return null

          const iconName = (titleField.props['icon'] ?? 'circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
          const bgColor = (titleField.props['bgColor'] as string | undefined) ?? '#F3F4F6'
          const iconColor = (titleField.props['color'] as string | undefined) ?? colors.primary
          const stepNumber = titleField.props['step_number'] ?? String(idx + 1)
          const isExpanded = expandedSections.has(sectionId)
          const sectionItems = itemsBySection.get(sectionId) ?? []

          return (
            <View key={sectionId} style={esStyles.card}>
              <Pressable
                style={esStyles.stepHeader}
                onPress={() => toggleSection(sectionId)}
                testID={`step-header-${stepNumber}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
              >
                <View style={[esStyles.stepIconBg, { backgroundColor: bgColor }]}>
                  <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                </View>
                <View style={esStyles.stepInfo}>
                  <Text style={esStyles.stepNumber}>{t('modules.crisis_plan.step_label').replace('{{number}}', String(stepNumber))}</Text>
                  <Text style={esStyles.stepTitle}>{t(titleField.text_code ?? '')}</Text>
                </View>
                <View style={esStyles.stepRight}>
                  {sectionItems.length > 0 && (
                    <View style={esStyles.badge}>
                      <Text style={esStyles.badgeText}>{sectionItems.length}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={esStyles.stepContent}>
                  {hintField != null && (
                    <Text style={esStyles.stepHint}>{t(hintField.text_code ?? '')}</Text>
                  )}

                  {sectionItems.map(item => (
                    <View key={item.id} style={esStyles.itemRow}>
                      {editingId === item.id ? (
                        <View style={esStyles.editContainer}>
                          <TextInput style={esStyles.textInput} value={editText} onChangeText={setEditText} autoFocus multiline testID={`edit-input-${item.id}`} />
                          <View style={esStyles.actionRow}>
                            <Pressable style={[esStyles.actionBtn, esStyles.validateBtn]} onPress={() => handleSaveEdit(item)} testID={`validate-edit-${item.id}`}>
                              <Text style={esStyles.validateBtnText}>{t('common.validate')}</Text>
                            </Pressable>
                            <Pressable style={[esStyles.actionBtn, esStyles.cancelBtn]} onPress={handleCancelEdit}>
                              <Text style={esStyles.cancelBtnText}>{t('common.cancel')}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="circle-small" size={20} color={iconColor} />
                          <Pressable style={esStyles.itemTextArea} onPress={() => handleStartEdit(item)}>
                            <Text style={esStyles.itemContent}>{item.text}</Text>
                          </Pressable>
                          <Pressable onPress={() => handleDelete(item)} hitSlop={8} testID={`delete-item-${item.id}`} accessibilityLabel={`${t('common.delete')} : ${item.text}`}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                          </Pressable>
                        </>
                      )}
                    </View>
                  ))}

                  {addingToSection === sectionId ? (
                    <View style={esStyles.addForm}>
                      <TextInput
                        style={esStyles.textInput}
                        placeholder={t('modules.crisis_plan.item_placeholder')}
                        value={newItemText}
                        onChangeText={setNewItemText}
                        autoFocus
                        multiline
                        testID="new-item-input"
                      />
                      <View style={esStyles.actionRow}>
                        <Pressable style={[esStyles.actionBtn, esStyles.validateBtn]} onPress={() => handleSaveNew(sectionId)} testID="validate-new-item">
                          <Text style={esStyles.validateBtnText}>{t('common.validate')}</Text>
                        </Pressable>
                        <Pressable style={[esStyles.actionBtn, esStyles.cancelBtn]} onPress={handleCancelAdd} testID="cancel-new-item">
                          <Text style={esStyles.cancelBtnText}>{t('common.cancel')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable style={esStyles.addBtn} onPress={() => handleStartAdd(sectionId)} testID={`add-to-step-${stepNumber}`}>
                      <MaterialCommunityIcons name="plus" size={18} color={iconColor} />
                      <Text style={[esStyles.addBtnText, { color: iconColor }]}>{t('modules.crisis_plan.add_item')}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      {emergencyFields.length > 0 && (
        <View style={esStyles.emergencyBar}>
          <View style={esStyles.emergencyRow}>
            {emergencyFields.map(f => {
              const phone = f.props['phone'] ?? ''
              const btnColor = (f.props['bgColor'] as string | undefined) ?? '#DC2626'
              return (
                <Pressable
                  key={f.id}
                  style={[esStyles.emergencyBtn, { backgroundColor: btnColor }]}
                  onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
                  testID={`emergency-${phone}`}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                  <View>
                    <Text style={esStyles.emergencyNumber}>{t(f.text_code ?? '')}</Text>
                    {f.props['label_code'] != null && (
                      <Text style={esStyles.emergencyLabel}>{t(f.props['label_code'] as string)}</Text>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}

// ─── Layout — exercice à tapotements chronométrés ────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

function TimedTapExerciseLayout({ fields, t }: {
  fields: ContentField[]
  t: (key: string) => string
}) {
  // ── Config (stable — fields ne changent pas pendant la durée de vie du composant)
  const configField = fields.find(f => f.field_type === 'timed_tap_config')
  const durationSeconds = parseInt((configField?.props['duration_seconds'] as string | undefined) ?? '90', 10)
  const maxWordLength = parseInt((configField?.props['max_word_length'] as string | undefined) ?? '40', 10)
  const vibrationMs = parseInt((configField?.props['vibration_ms'] as string | undefined) ?? '30', 10)

  // ── Résolution de texte depuis les champs
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }
  const deleteLabel = ft('timed_tap_delete_label')

  // ── State
  const [mode, setMode] = useState<'history' | 'input' | 'exercise' | 'done'>('history')
  const [sessions, setSessions] = useState<CognitiveSaturationSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [word, setWord] = useState('')
  const [repetitions, setRepetitions] = useState(0)
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [saving, setSaving] = useState(false)
  const elapsedRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getAllCognitiveSaturationSessions().then(data => {
      setSessions(data)
      setLoadingSessions(false)
    })
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startTimer = useCallback(() => {
    elapsedRef.current = 0
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setMode('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleStartExercise = useCallback(() => { setWord(''); setMode('input') }, [])

  const handleStart = useCallback(() => {
    if (!word.trim()) return
    setRepetitions(0)
    setTimeLeft(durationSeconds)
    setMode('exercise')
    startTimer()
  }, [word, durationSeconds, startTimer])

  const handleTap = useCallback(() => {
    Vibration.vibrate(vibrationMs)
    setRepetitions(prev => prev + 1)
  }, [vibrationMs])

  const handleStopEarly = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setMode('done')
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const session = { id: generateId(), word: word.trim(), repetitions, duration_seconds: elapsedRef.current }
      await saveCognitiveSaturationSession(session)
      setSessions(prev => [{ ...session, created_at: new Date().toISOString() }, ...prev])
    } finally {
      setSaving(false)
      setMode('history')
    }
  }, [word, repetitions])

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setWord('')
    setRepetitions(0)
    setTimeLeft(durationSeconds)
    elapsedRef.current = 0
    setMode('input')
  }, [durationSeconds])

  const handleDelete = useCallback((id: string) => {
    Alert.alert(deleteLabel || t('common.delete'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          await deleteCognitiveSaturationSession(id)
          setSessions(prev => prev.filter(s => s.id !== id))
        },
      },
    ])
  }, [deleteLabel, t])

  // ── Mode historique
  if (mode === 'history') {
    const historyLabelTemplate = ft('timed_tap_history_label')
    const historyLabel = historyLabelTemplate.replace('{{count}}', String(sessions.length))

    if (loadingSessions) {
      return <View style={ttStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
    }

    return (
      <View style={ttStyles.safe}>
        <Pressable style={ttStyles.startBtn} onPress={handleStartExercise} accessibilityRole="button" testID="start-exercise-button">
          <MaterialCommunityIcons name="repeat" size={20} color={colors.white} />
          <Text style={ttStyles.startBtnText}>{ft('timed_tap_start_btn')}</Text>
        </Pressable>

        <ScrollView contentContainerStyle={ttStyles.container}>
          <View style={ttStyles.introCard} testID="intro-card">
            <MaterialCommunityIcons name="chat-processing-outline" size={24} color={colors.primary} />
            <Text style={ttStyles.introText}>{ft('timed_tap_intro_text')}</Text>
          </View>

          {sessions.length === 0 ? (
            <View style={ttStyles.empty} testID="empty-state">
              <MaterialCommunityIcons name="chat-processing-outline" size={52} color={colors.border} />
              <Text style={ttStyles.emptyTitle}>{ft('timed_tap_empty_title')}</Text>
              <Text style={ttStyles.emptyText}>{ft('timed_tap_empty_text')}</Text>
            </View>
          ) : (
            <View style={ttStyles.section}>
              {historyLabel ? <Text style={ttStyles.sectionLabel}>{historyLabel}</Text> : null}
              {sessions.map(session => (
                <View key={session.id} style={ttStyles.sessionCard} testID={`session-card-${session.id}`}>
                  <View style={ttStyles.sessionHeader}>
                    <View style={ttStyles.wordBadge}>
                      <Text style={ttStyles.wordText} numberOfLines={1}>{session.word}</Text>
                    </View>
                    <Pressable onPress={() => handleDelete(session.id)} accessibilityRole="button" accessibilityLabel={deleteLabel} hitSlop={8}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  <View style={ttStyles.sessionStats}>
                    <View style={ttStyles.statItem}>
                      <MaterialCommunityIcons name="gesture-tap" size={14} color={colors.textMuted} />
                      <Text style={ttStyles.statText}>{session.repetitions} {ft('timed_tap_rep_label')}</Text>
                    </View>
                    <View style={ttStyles.statItem}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                      <Text style={ttStyles.statText}>{formatDuration(session.duration_seconds)}</Text>
                    </View>
                  </View>
                  <Text style={ttStyles.sessionDate}>{formatDateTime(session.created_at)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Mode saisie du mot
  if (mode === 'input') {
    const howBodyCode = fields.find(f => f.field_type === 'timed_tap_how_body')?.text_code
    const howBodyText = howBodyCode
      ? t(howBodyCode).replace('{{seconds}}', String(durationSeconds))
      : ''

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={ttStyles.container}>
          <View style={ttStyles.inputCard} testID="input-card">
            <MaterialCommunityIcons name="chat-processing-outline" size={32} color={colors.primary} />
            <Text style={ttStyles.inputTitle}>{ft('timed_tap_input_title')}</Text>
            <Text style={ttStyles.inputHint}>{ft('timed_tap_input_hint')}</Text>
            <TextInput
              style={ttStyles.wordInput}
              placeholder={ft('timed_tap_input_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={word}
              onChangeText={v => setWord(v.slice(0, maxWordLength))}
              maxLength={maxWordLength}
              returnKeyType="done"
              autoFocus
              testID="word-input"
            />
            <Text style={ttStyles.charCount} testID="char-count">{word.length}/{maxWordLength}</Text>
          </View>

          {(ft('timed_tap_how_title') || howBodyText) ? (
            <View style={ttStyles.instructionCard}>
              {ft('timed_tap_how_title') ? <Text style={ttStyles.instructionTitle}>{ft('timed_tap_how_title')}</Text> : null}
              {howBodyText ? <Text style={ttStyles.instructionText}>{howBodyText}</Text> : null}
            </View>
          ) : null}

          <Pressable
            style={[ttStyles.startBtn, !word.trim() && ttStyles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!word.trim()}
            accessibilityRole="button"
            testID="confirm-start-button"
          >
            <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.white} />
            <Text style={ttStyles.startBtnText}>{ft('timed_tap_start_btn')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  // ── Mode exercice
  if (mode === 'exercise') {
    const progress = timeLeft / durationSeconds
    return (
      <View style={ttStyles.exerciseContainer} testID="exercise-mode">
        <View style={ttStyles.progressBar} testID="progress-bar">
          <View style={[ttStyles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={ttStyles.timeLabel} testID="time-label">{timeLeft}s</Text>
        <Text style={ttStyles.repCounter} testID="rep-counter">{repetitions}</Text>
        <Text style={ttStyles.repLabel}>{ft('timed_tap_rep_label')}</Text>
        <Pressable style={ttStyles.wordTapArea} onPress={handleTap} accessibilityRole="button" testID="word-tap-button">
          <Text style={ttStyles.wordDisplay} adjustsFontSizeToFit numberOfLines={2}>{word}</Text>
          <Text style={ttStyles.tapHint}>{ft('timed_tap_tap_hint')}</Text>
        </Pressable>
        <Pressable style={ttStyles.stopBtn} onPress={handleStopEarly} accessibilityRole="button" testID="stop-button">
          <Text style={ttStyles.stopBtnText}>{t('common.stop')}</Text>
        </Pressable>
      </View>
    )
  }

  // ── Mode terminé
  const effectiveDuration = durationSeconds - timeLeft
  return (
    <ScrollView contentContainerStyle={ttStyles.container}>
      <View style={ttStyles.doneCard} testID="done-card">
        <MaterialCommunityIcons name="check-circle-outline" size={56} color={colors.success} />
        <Text style={ttStyles.doneTitle}>{ft('timed_tap_done_title')}</Text>
        <Text style={ttStyles.doneText}>{ft('timed_tap_done_text')}</Text>
      </View>

      <View style={ttStyles.summaryCard} testID="summary-card">
        <View style={ttStyles.summaryRow}>
          <MaterialCommunityIcons name="chat-processing-outline" size={18} color={colors.primary} />
          <Text style={ttStyles.summaryWord}>{word}</Text>
        </View>
        <View style={ttStyles.summaryStats}>
          <View style={ttStyles.summaryStatItem}>
            <Text style={ttStyles.summaryStatValue} testID="done-repetitions">{repetitions}</Text>
            <Text style={ttStyles.summaryStatLabel}>{ft('timed_tap_rep_stat_label')}</Text>
          </View>
          <View style={ttStyles.summaryDivider} />
          <View style={ttStyles.summaryStatItem}>
            <Text style={ttStyles.summaryStatValue} testID="done-duration">{effectiveDuration}s</Text>
            <Text style={ttStyles.summaryStatLabel}>{ft('timed_tap_duration_stat_label')}</Text>
          </View>
        </View>
      </View>

      <Pressable style={[ttStyles.saveBtn, saving && ttStyles.btnDisabled]} onPress={handleSave} disabled={saving} accessibilityRole="button" testID="save-button">
        <Text style={ttStyles.saveBtnText}>{saving ? '…' : t('common.save')}</Text>
        {!saving && <MaterialCommunityIcons name="check" size={20} color={colors.white} />}
      </Pressable>

      <Pressable style={ttStyles.restartBtn} onPress={handleRestart} accessibilityRole="button" testID="restart-button">
        <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
        <Text style={ttStyles.restartBtnText}>{t('common.restart')}</Text>
      </Pressable>
    </ScrollView>
  )
}

// ─── Questionnaire props ──────────────────────────────────────────────────────

export interface QuestionnaireInteraction {
  answers: (number | null)[]
  onAnswer: (index: number, value: number) => void
  textInputValues?: Record<string, string>
  onTextInput?: (fieldId: string, value: string) => void
  accentColor?: string
}

// ─── Main ────────────────────────────────────────────────────────────────────

export interface FieldRendererProps {
  preview_kind: string
  fields: ContentField[]
  /** Provided only for questionnaire layout in patient-side interactive mode. */
  questionnaire?: QuestionnaireInteraction
  /** Accent color for teen mode or module-specific theming. */
  accentColor?: string
  /** Per-patient config from patient_modules.config — required for patient_scenario layout. */
  patientConfig?: Record<string, unknown> | null
  /** Module identifier — required for editable_steps layout to persist plan items. */
  moduleId?: string
}

export function FieldRenderer({ preview_kind, fields, questionnaire, accentColor, patientConfig, moduleId }: FieldRendererProps) {
  const { isTeenMode } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')

  if (preview_kind === 'coming_soon' || fields.length === 0) return null

  const visibleFields = fields.filter(
    f => f.field_type !== 'module_label' && f.field_type !== 'module_description'
  )
  const footer = visibleFields.find(f => f.field_type === 'footer_note')
  const contentFields = visibleFields.filter(f => f.field_type !== 'footer_note')

  if (preview_kind === 'questionnaire') {
    if (questionnaire == null) return null
    return (
      <QuestionnaireLayout
        fields={visibleFields}
        answers={questionnaire.answers}
        onAnswer={questionnaire.onAnswer}
        textInputValues={questionnaire.textInputValues}
        onTextInput={questionnaire.onTextInput}
        accentColor={questionnaire.accentColor}
        t={t}
      />
    )
  }

  if (preview_kind === 'guided_exercise') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    const uiFields = contentFields.filter(f => f.section_id == null)
    return (
      <GuidedExerciseLayout
        sections={sections}
        uiFields={uiFields}
        footer={footer}
        t={t}
        accentColor={accentColor}
      />
    )
  }

  if (preview_kind === 'steps' || preview_kind === 'cards') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    if (preview_kind === 'steps') {
      return <StepsLayout sections={sections} footer={footer} t={t} />
    }
    return <CardsLayout sections={sections} t={t} />
  }

  if (preview_kind === 'fields') {
    const fieldRows = contentFields.filter(f => f.field_type === 'field_row')
    return <FieldsLayout fields={fieldRows} footer={footer} t={t} />
  }

  if (preview_kind === 'patient_scenario') {
    return (
      <PatientScenarioLayout
        fields={visibleFields}
        patientConfig={patientConfig ?? null}
        t={t}
      />
    )
  }

  if (preview_kind === 'grid2x2') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    return <Grid2x2Layout sections={sections} footer={footer} t={t} />
  }

  if (preview_kind === 'timed_tap_exercise') {
    return <TimedTapExerciseLayout fields={visibleFields} t={t} />
  }

  if (preview_kind === 'editable_steps') {
    const sections = new Map<string, ContentField[]>()
    for (const f of contentFields) {
      if (!f.section_id) continue
      if (!sections.has(f.section_id)) sections.set(f.section_id, [])
      sections.get(f.section_id)!.push(f)
    }
    const uiFields = contentFields.filter(f => f.section_id == null)
    return (
      <EditableStepsLayout
        sections={sections}
        uiFields={uiFields}
        moduleId={moduleId ?? ''}
        t={t}
      />
    )
  }

  return null
}

const styles = StyleSheet.create({
  divider:        { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  stepsContainer: { gap: spacing.md },
  stepRow:        { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepBadge:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepContent:    { flex: 1 },
  listBlock:      { gap: 2 },
  fieldsBlock:    { gap: 0 },
  infoBox:        { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 12, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quadrant:       { width: '47%', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12 },
  cardsBlock:     { gap: 8 },
  card:           { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  cardMeta:       { flex: 1 },
  cardFallbackTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardBody:       { padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  // Questionnaire
  questionnaireContainer: { gap: spacing.md },
  instructionBlock: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  instructionText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  legendRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem:     { alignItems: 'center', flex: 1 },
  legendNum:      { fontSize: 15, fontWeight: '700', color: colors.primary },
  legendLabel:    { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  warningBlock:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 8, padding: spacing.sm },
  warningText:    { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  questionsBlock: { gap: spacing.sm },
  sectionHeader:  { paddingVertical: 6, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 4 },
  sectionLabel:   { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  questionCard:   { backgroundColor: colors.card, borderRadius: 10, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  questionText:   { fontSize: 14, color: colors.text, lineHeight: 20 },
  questionNum:    { fontWeight: '700', color: colors.primary },
  footerText:     { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
  // Extra inputs (scale_number_input / scale_text_input)
  supplementaryBlock: { gap: spacing.sm },
  supplementaryTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 2,
  },
  extraCard: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  extraLabel: { fontSize: 14, color: colors.text, lineHeight: 20 },
  numberInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, fontSize: 16, color: colors.text,
    width: 70, textAlign: 'center',
  },
  numberInputUnit: { fontSize: 16, color: colors.textMuted },
  textInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, color: colors.text,
  },
  sliderCard:      { backgroundColor: colors.card, borderRadius: 10, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  sliderHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sliderLabel:     { fontSize: 15, fontWeight: '600' },
  sliderValue:     { fontSize: 24, fontWeight: '800', minWidth: 32, textAlign: 'right' },
  sliderPips:      { flexDirection: 'row', gap: 4 },
  sliderPip:       { flex: 1, aspectRatio: 1, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  sliderPipText:   { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  sliderPipTextSelected: { color: colors.white, fontWeight: '700' },
  sliderHints:     { flexDirection: 'row', justifyContent: 'space-between' },
  sliderHint:      { fontSize: 11, color: colors.textMuted },
})

const gStyles = StyleSheet.create({
  container:       { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  // ── Intro
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  introTitle:     { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  introText:      { fontSize: 15, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  section:        { gap: spacing.sm },
  sectionLabel:   { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  stepsPreviewCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  previewRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewBadge:   { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  previewCount:   { fontSize: 14, fontWeight: '700' },
  previewSense:   { fontSize: 15, color: colors.text, fontWeight: '500' },
  noteCard:       { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingHorizontal: spacing.sm },
  noteText:       { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  startBtnText:   { fontSize: 16, fontWeight: '700', color: colors.white },
  // ── Guided
  guidedContainer: {
    flex: 1, backgroundColor: colors.background,
    padding: spacing.lg, gap: spacing.lg, justifyContent: 'center',
  },
  progressBar:    { height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: radius.full },
  progressLabel:  { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  stepCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md, borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  stepIconCircle: { width: 96, height: 96, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  stepCountBadge: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  stepCountText:  { fontSize: 18, fontWeight: '800', color: colors.white },
  stepSense:      { fontSize: 20, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  stepInstruction: { fontSize: 17, color: colors.text, textAlign: 'center', lineHeight: 26, fontWeight: '500' },
  stepTip:        { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
  nextBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  nextBtnText:    { fontSize: 16, fontWeight: '700', color: colors.white },
  cancelBtn:      { alignItems: 'center', paddingVertical: spacing.sm },
  cancelBtnText:  { fontSize: 14, color: colors.textMuted },
  // ── Done
  doneCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  doneTitle:      { fontSize: 24, fontWeight: '700', color: colors.text },
  doneText:       { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  restartBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  // ── Safety
  safetySection: {
    backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: '#FECACA',
  },
  safetyTitle:    { fontSize: 12, fontWeight: '700', color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.8 },
  safetyBtn:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  safetyBtnText:  { fontSize: 14, color: '#DC2626', fontWeight: '500' },
})

const psStyles = StyleSheet.create({
  container:       { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  emptyCenter:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md, minHeight: 300 },
  emptyTitle:      { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyText:       { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  // Disclaimer
  warningCard: {
    backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
  },
  warningText:     { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  // Sections
  section:         { gap: spacing.sm },
  sectionLabel:    { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionHint:     { fontSize: 13, color: colors.textMuted, marginTop: -spacing.xs },
  // Scénario
  scenarioCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: spacing.sm,
  },
  scenarioIcon:    { alignSelf: 'flex-start' },
  scenarioText:    { fontSize: 16, color: colors.text, lineHeight: 26 },
  // Étapes
  stepsCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  stepRow:         { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepBadge:       { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  stepBadgeText:   { fontSize: 11, fontWeight: '700', color: colors.primary },
  stepText:        { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  // Scénario original
  collapsibleHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
  },
  collapsibleLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  originalCard:    { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.border },
  originalText:    { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  // Sons
  soundsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  soundBtn: {
    flex: 1, minWidth: '28%', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: spacing.md, backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  soundBtnActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  soundBtnUnavailable: { opacity: 0.5 },
  soundLabel:          { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  soundLabelActive:    { color: colors.white },
  soundLabelMuted:     { color: colors.textMuted },
  soundComingSoon:     { fontSize: 9, color: colors.textMuted, fontStyle: 'italic' },
})

const esStyles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  scroll:          { flex: 1 },
  scrollContent:   { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card:            { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  stepHeader:      { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  stepIconBg:      { width: 42, height: 42, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  stepInfo:        { flex: 1 },
  stepNumber:      { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle:       { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  stepRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge:           { backgroundColor: colors.primary, borderRadius: radius.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepContent:     { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.sm },
  stepHint:        { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.xs },
  itemRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  itemTextArea:    { flex: 1 },
  itemContent:     { fontSize: 15, color: colors.text, lineHeight: 22 },
  editContainer:   { flex: 1, gap: spacing.xs },
  addForm:         { gap: spacing.xs, marginTop: spacing.xs },
  textInput:       { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, padding: spacing.sm, fontSize: 15, color: colors.text, minHeight: 44 },
  actionRow:       { flexDirection: 'row', gap: spacing.sm },
  actionBtn:       { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  validateBtn:     { backgroundColor: colors.primary },
  validateBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn:       { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText:   { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, marginTop: spacing.xs },
  addBtnText:      { fontSize: 14, fontWeight: '500' },
  emergencyBar:    { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  emergencyRow:    { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  emergencyBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, gap: spacing.sm },
  emergencyNumber: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  emergencyLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 14 },
})

const ttStyles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  container:        { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText:     { fontSize: 16, fontWeight: '700', color: colors.white },
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  introText:        { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  section:          { gap: spacing.sm },
  sectionLabel:     { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  sessionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sessionHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  wordBadge:        { flex: 1, backgroundColor: colors.primaryLight, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  wordText:         { fontSize: 15, fontWeight: '700', color: colors.primary },
  sessionStats:     { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  statItem:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:         { fontSize: 13, color: colors.textMuted },
  sessionDate:      { fontSize: 11, color: colors.border, marginTop: 2 },
  empty:            { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle:       { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  inputCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  inputTitle:       { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  inputHint:        { fontSize: 14, color: colors.textMuted, lineHeight: 20, textAlign: 'center' },
  wordInput: {
    width: '100%', backgroundColor: colors.background, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary, padding: spacing.md,
    fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center',
  },
  charCount:        { fontSize: 12, color: colors.textMuted, alignSelf: 'flex-end' },
  instructionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  instructionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  instructionText:  { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  exerciseContainer: {
    flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  progressBar:      { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:     { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  timeLabel:        { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  repCounter:       { fontSize: 72, fontWeight: '800', color: colors.primary, lineHeight: 80 },
  repLabel:         { fontSize: 14, color: colors.textMuted, marginTop: -spacing.sm },
  wordTapArea: {
    width: '100%', backgroundColor: colors.card, borderRadius: radius.lg,
    paddingVertical: spacing.xl, paddingHorizontal: spacing.lg,
    alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    marginVertical: spacing.md,
  },
  wordDisplay:      { fontSize: 36, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  tapHint:          { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  stopBtn:          { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  stopBtnText:      { fontSize: 15, color: colors.textMuted, fontWeight: '500' },
  doneCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  doneTitle:        { fontSize: 24, fontWeight: '700', color: colors.text },
  doneText:         { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  summaryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryWord:      { fontSize: 17, fontWeight: '700', color: colors.primary, flex: 1 },
  summaryStats:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryStatItem:  { alignItems: 'center', gap: 2 },
  summaryStatValue: { fontSize: 32, fontWeight: '800', color: colors.text },
  summaryStatLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryDivider:   { width: 1, height: 40, backgroundColor: colors.border },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  saveBtnText:      { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled:      { opacity: 0.6 },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  restartBtnText:   { fontSize: 15, fontWeight: '600', color: colors.primary },
})
