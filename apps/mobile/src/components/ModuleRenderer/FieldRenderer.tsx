import React, { useState, useCallback, useEffect, useMemo, useRef, ComponentType } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, TextInput, Alert, ActivityIndicator, Vibration, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { logger } from '@psytool/shared'
import { colors, spacing, radius } from '../../theme'
import type { ContentField } from '../../services/moduleService'
import { getAllPlanItemsForModule, savePlanItem, deletePlanItem, generateId, type PlanItem, getAllCognitiveSaturationSessions, saveCognitiveSaturationSession, deleteCognitiveSaturationSession, type CognitiveSaturationSession, getDailyEntry, getAllDailyEntries, saveDailyEntry, deleteDailyEntry, type DailyEntry, getAllFormEntries, saveFormEntry, deleteFormEntry, type FormEntry, getAllTreeSelections, saveTreeSelection, deleteTreeSelection, type TreeSelection, type TreeSelectionPathNode, getAllSleepEntries, getSleepEntry, getSleepEntriesForMonth, saveSleepEntry, deleteSleepEntry, computeSleepDuration, computeSleepEfficiency, type SleepEntry } from '../../lib/database'
import { formatDateTime, formatDateFull, formatDateNumeric, formatDateShort } from '../../lib/dateUtils'
import { logEvent, type EngagementEventType } from '../../services/engagementService'
import { useAuthStore } from '../../store/authStore'
import { useModuleT } from '../../hooks/useModuleT'
import { LikertWidget, type LikertOption } from './fields/widgets/LikertWidget'
import { PipPicker } from '../PipPicker'
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

function renderField(f: ContentField): React.ReactNode {
  const Component = FIELD_REGISTRY[f.field_type]
  if (!Component) {
    logger.warn(`[ModuleRenderer] field_type non géré : "${f.field_type}"`)
    return null
  }
  return <Component key={f.id} field={f} />
}

// ─── List rendering ───────────────────────────────────────────────────────────

function renderCardBodyFields(fields: ContentField[]): React.ReactNode {
  const result: React.ReactNode[] = []
  let listBuffer: ContentField[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listBuffer.length === 0) return
    result.push(
      <View key={`list-${listBuffer[0].id}`} style={styles.listBlock}>
        {listBuffer.map(f => renderField(f))}
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
      result.push(renderField(f))
    }
  }
  flushList()
  return result
}

// ─── Layouts — preview (read-only) ───────────────────────────────────────────

function StepsLayout({ sections, footer }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
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
              <FieldText field={titleField} />
              {hintField && <FieldText field={hintField} />}
            </View>
          </View>
        )
      })}
      {footer && <FieldText field={footer} />}
    </View>
  )
}

function FieldsLayout({ fields, footer }: {
  fields: ContentField[]
  footer: ContentField | undefined
}) {
  return (
    <View>
      <View style={styles.fieldsBlock}>
        {fields.map(f => <FieldRow key={f.id} field={f} />)}
      </View>
      {footer && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <FieldText field={footer} />
        </View>
      )}
    </View>
  )
}

function Grid2x2Layout({ sections, footer }: {
  sections: Map<string, ContentField[]>
  footer: ContentField | undefined
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
              {titleField && <FieldText field={titleField} />}
              {subtitleField && <FieldText field={subtitleField} />}
            </View>
          )
        })}
      </View>
      {footer && <FieldText field={footer} />}
    </View>
  )
}

function CardsLayout({ sections }: {
  sections: Map<string, ContentField[]>
}) {
  const t = useModuleT()
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
                  ? <FieldText field={titleField} />
                  : <Text style={styles.cardFallbackTitle}>{sectionId}</Text>
                }
                {summaryField && <FieldText field={summaryField} />}
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            {isOpen && bodyFields.length > 0 && (
              <View style={styles.cardBody}>
                {renderCardBodyFields(bodyFields)}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

// ─── Layout — questionnaire interactif (patient) ──────────────────────────────

function QuestionnaireLayout({ fields, answers, onAnswer, textInputValues, onTextInput, accentColor }: {
  fields: ContentField[]
  answers: (number | null)[]
  onAnswer: (index: number, value: number) => void
  textInputValues?: Record<string, string>
  onTextInput?: (fieldId: string, value: string) => void
  accentColor?: string
}) {
  const t = useModuleT()
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

function ExerciseSafetySection({ fields }: { fields: ContentField[] }) {
  const t = useModuleT()
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

function GuidedExerciseLayout({ sections, uiFields, footer, accentColor }: {
  sections: Map<string, ContentField[]>
  uiFields: ContentField[]
  footer: ContentField | undefined
  accentColor?: string
}) {
  const t = useModuleT()
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

        <ExerciseSafetySection fields={uiFields} />
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

      <ExerciseSafetySection fields={uiFields} />
    </ScrollView>
  )
}

// ─── Layout — patient_scenario (per-patient config) ─────────────────────────

function PatientScenarioLayout({ fields, patientConfig }: {
  fields: ContentField[]
  patientConfig: Record<string, unknown> | null
}) {
  const t = useModuleT()
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

      <ExerciseSafetySection fields={fields} />
    </ScrollView>
  )
}

// ─── Layout — plan éditable (crisis_plan…) ────────────────────────────────────

function EditableStepsLayout({ sections, uiFields, moduleId }: {
  sections: Map<string, ContentField[]>
  uiFields: ContentField[]
  moduleId: string
}) {
  const t = useModuleT()
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

function TimedTapExerciseLayout({ fields }: {
  fields: ContentField[]
}) {
  const t = useModuleT()
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

// ─── Layout — saisie quotidienne (medication_adherence…) ────────────────────
//
// Pattern « 1 statut par jour, persistance UPSERT par (module_id, date) ».
// 2 onglets internes : today | history. Aucune navigation externe.
// Le statut sélectionné, les notes, et la liste 30j sont gérés en interne.
// Conformité MDR 2017/745 : aucun seuil interprétatif, juste affichage des
// déclarations brutes du patient + pastilles de couleur fournies par la base.

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function DailyCheckinLayout({ fields, moduleId }: {
  fields: ContentField[]
  moduleId: string
}) {
  const t = useModuleT()
  const patient = useAuthStore(s => s.patient)

  // ── Résolution des champs DB-driven
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }
  const configField = fields.find(f => f.field_type === 'daily_checkin_config')
  const engagementEventType = (configField?.props['engagement_event_type'] ?? '') as EngagementEventType | ''

  const statusOptions = useMemo(
    () => fields
      .filter(f => f.field_type === 'daily_status_option')
      .sort((a, b) => a.sort_order - b.sort_order),
    [fields]
  )

  // ── State
  const todayDate = useMemo(() => todayISO(), [])
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [todayEntry, history] = await Promise.all([
      getDailyEntry(moduleId, todayDate),
      getAllDailyEntries(moduleId, 30),
    ])
    if (todayEntry) {
      setExistingId(todayEntry.id)
      setSelectedValue(todayEntry.status)
      setNotes(todayEntry.notes ?? '')
    } else {
      setExistingId(null)
      setSelectedValue(null)
      setNotes('')
    }
    setEntries(history)
    setLoading(false)
  }, [moduleId, todayDate])

  useEffect(() => { void loadData() }, [loadData])

  const handleSave = useCallback(async () => {
    if (!selectedValue) {
      Alert.alert(
        ft('daily_status_missing_title') || t('common.error'),
        ft('daily_status_missing_msg'),
      )
      return
    }
    setSaving(true)
    try {
      const entry: Omit<DailyEntry, 'created_at'> = {
        id: existingId ?? generateId(),
        module_id: moduleId,
        date: todayDate,
        status: selectedValue,
        notes: notes.trim() || null,
      }
      await saveDailyEntry(entry)
      if (patient?.id && engagementEventType) {
        await logEvent(patient.id, engagementEventType as EngagementEventType, {})
      }
      setExistingId(entry.id)
      await loadData()
      const savedMsg = ft('daily_saved_message')
      if (savedMsg) Alert.alert(t('common.saved'), savedMsg)
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [selectedValue, existingId, notes, moduleId, todayDate, patient, engagementEventType, loadData, ft, t])

  const handleDelete = useCallback((entry: DailyEntry) => {
    Alert.alert(
      ft('daily_delete_title') || t('common.delete'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteDailyEntry(entry.id)
            setEntries(prev => prev.filter(e => e.id !== entry.id))
            if (entry.date === todayDate) {
              setExistingId(null)
              setSelectedValue(null)
              setNotes('')
            }
          },
        },
      ]
    )
  }, [ft, t, todayDate])

  if (loading) {
    return <View style={dcStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  const saveLabel = existingId
    ? (ft('daily_update_label') || t('common.update'))
    : (ft('daily_save_label') || t('common.save'))
  const tabTodayLabel = ft('daily_tab_today_label')
  const tabHistoryLabel = ft('daily_tab_history_label')

  return (
    <KeyboardAvoidingView
      style={dcStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {/* Onglets */}
      <View style={dcStyles.tabs}>
        <Pressable
          style={[dcStyles.tab, tab === 'today' && dcStyles.tabActive]}
          onPress={() => setTab('today')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'today' }}
          testID="tab-today"
        >
          <Text style={[dcStyles.tabText, tab === 'today' && dcStyles.tabTextActive]}>{tabTodayLabel}</Text>
        </Pressable>
        <Pressable
          style={[dcStyles.tab, tab === 'history' && dcStyles.tabActive]}
          onPress={() => setTab('history')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'history' }}
          testID="tab-history"
        >
          <Text style={[dcStyles.tabText, tab === 'history' && dcStyles.tabTextActive]}>{tabHistoryLabel}</Text>
          {entries.length > 0 && (
            <View style={dcStyles.tabBadge}><Text style={dcStyles.tabBadgeText}>{entries.length}</Text></View>
          )}
        </Pressable>
      </View>

      {tab === 'today' ? (
        <ScrollView
          style={dcStyles.scroll}
          contentContainerStyle={dcStyles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date du jour */}
          <View style={dcStyles.dateHeader}>
            <Text style={dcStyles.dateLabel}>{ft('daily_today_label')}</Text>
            <Text style={dcStyles.dateValue}>{formatDateFull(todayDate)}</Text>
          </View>

          {/* Indicateur saisie déjà effectuée */}
          {existingId && ft('daily_already_saved_label') ? (
            <View style={dcStyles.savedBadge} testID="already-saved-badge">
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
              <Text style={dcStyles.savedBadgeText}>{ft('daily_already_saved_label')}</Text>
            </View>
          ) : null}

          {/* Question + boutons de statut */}
          <View style={dcStyles.questionCard}>
            <Text style={dcStyles.questionText}>{ft('daily_question')}</Text>
            <View style={dcStyles.statusRow}>
              {statusOptions.map(opt => {
                const value = opt.props['value'] ?? ''
                const iconName = (opt.props['icon'] ?? 'circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
                const color = opt.props['color'] ?? colors.textMuted
                const bgColor = opt.props['bg_color'] ?? colors.background
                const selected = selectedValue === value
                const label = opt.text_code ? t(opt.text_code) : value
                return (
                  <Pressable
                    key={opt.id}
                    style={[
                      dcStyles.statusBtn,
                      selected && { backgroundColor: bgColor, borderColor: color },
                    ]}
                    onPress={() => setSelectedValue(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={label}
                    testID={`status-${value}`}
                  >
                    <MaterialCommunityIcons name={iconName} size={22} color={selected ? color : colors.border} />
                    <Text style={[dcStyles.statusLabel, selected && { color }]}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={dcStyles.notesSection}>
            <Text style={dcStyles.notesLabel}>{ft('daily_notes_label') || t('common.notes_optional')}</Text>
            <TextInput
              style={dcStyles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={ft('daily_notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={dcStyles.scroll} contentContainerStyle={dcStyles.content}>
          {entries.length === 0 ? (
            <View style={dcStyles.empty} testID="history-empty">
              <Text style={dcStyles.emptyText}>{ft('daily_history_empty_text')}</Text>
            </View>
          ) : (
            <View style={dcStyles.list}>
              {entries.map(entry => {
                const meta = statusOptions.find(o => (o.props['value'] ?? '') === (entry.status ?? ''))
                const iconName = (meta?.props['icon'] ?? 'circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
                const color = meta?.props['color'] ?? colors.textMuted
                const bgColor = meta?.props['bg_color'] ?? colors.background
                const label = meta?.text_code ? t(meta.text_code) : (entry.status ?? '')
                return (
                  <View key={entry.id} style={dcStyles.histCard} testID={`history-${entry.id}`}>
                    <View style={dcStyles.histMain}>
                      <Text style={dcStyles.histDate}>{formatDateNumeric(entry.date)}</Text>
                      <View style={[dcStyles.histBadge, { backgroundColor: bgColor }]}>
                        <MaterialCommunityIcons name={iconName} size={13} color={color} />
                        <Text style={[dcStyles.histBadgeText, { color }]}>{label}</Text>
                      </View>
                      {entry.notes ? (
                        <Text style={dcStyles.histNotes} numberOfLines={1}>{entry.notes}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(entry)}
                      hitSlop={8}
                      accessibilityLabel={t('common.delete')}
                      testID={`delete-${entry.id}`}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Footer bouton sauvegarder — uniquement sur l'onglet Aujourd'hui */}
      {tab === 'today' && (
        <View style={dcStyles.footer}>
          <Pressable
            style={[dcStyles.saveBtn, saving && dcStyles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            testID="save-button"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
                <Text style={dcStyles.saveBtnText}>{saveLabel}</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

// ─── Layout — formulaire à colonnes hétérogènes (beck_columns…) ─────────────
//
// Pattern « plusieurs enregistrements par module, chacun = un formulaire à
// champs hétérogènes ». Chaque section_id = une colonne. Chaque colonne
// contient un `column_header` et des champs enfants (`parent_field_id`)
// définissant le widget : `column_text_field` ou `column_slider_field`.
// Persistance JSON dans `form_entries`. 2 modes internes : list | entry.
// Conformité MDR 2017/745 : aucune interprétation, simple journal libre.

const PIP_STEPS_0_100 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

function buildPipSteps(min: number, max: number, step: number): number[] {
  const steps: number[] = []
  for (let v = min; v <= max; v += step) steps.push(v)
  return steps
}

interface ColumnSpec {
  sectionId: string
  header: ContentField
  children: ContentField[]
}

function ColumnFormLayout({ fields, moduleId }: {
  fields: ContentField[]
  moduleId: string
}) {
  const t = useModuleT()
  const patient = useAuthStore(s => s.patient)

  // ── Résolution des champs DB-driven
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const engagementEventType = (configField?.props['engagement_event_type'] ?? '') as EngagementEventType | ''
  const requiredKeysProp = configField?.props['required_keys_any'] ?? ''
  const requiredKeysAny = useMemo(
    () => requiredKeysProp.split(',').map(k => k.trim()).filter(Boolean),
    [requiredKeysProp]
  )

  // ── Construction des colonnes (sections triées par sort_order de leur column_header)
  const columns = useMemo<ColumnSpec[]>(() => {
    const headers = fields
      .filter(f => f.field_type === 'column_header' && f.section_id != null)
      .sort((a, b) => a.sort_order - b.sort_order)
    return headers.map(h => ({
      sectionId: h.section_id!,
      header: h,
      children: (h.children ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    }))
  }, [fields])

  // ── State
  const [mode, setMode] = useState<'list' | 'entry'>('list')
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [saving, setSaving] = useState(false)

  const loadEntries = useCallback(async () => {
    const data = await getAllFormEntries(moduleId)
    setEntries(data)
    setLoading(false)
  }, [moduleId])

  useEffect(() => { void loadEntries() }, [loadEntries])

  const initialValuesForNew = useCallback((): Record<string, string | number> => {
    const init: Record<string, string | number> = {}
    for (const col of columns) {
      for (const child of col.children) {
        const key = child.props['key']
        if (!key) continue
        if (child.field_type === 'column_slider_field') {
          const min = parseInt(child.props['min'] ?? '0', 10)
          const max = parseInt(child.props['max'] ?? '100', 10)
          init[key] = Math.round((min + max) / 2)
        } else {
          init[key] = ''
        }
      }
    }
    return init
  }, [columns])

  const handleNew = useCallback(() => {
    setEditingId(null)
    setValues(initialValuesForNew())
    setMode('entry')
  }, [initialValuesForNew])

  const handleEdit = useCallback((entry: FormEntry) => {
    const merged = { ...initialValuesForNew(), ...entry.values }
    setEditingId(entry.id)
    setValues(merged)
    setMode('entry')
  }, [initialValuesForNew])

  const handleCancelEntry = useCallback(() => {
    setMode('list')
    setEditingId(null)
    setValues({})
  }, [])

  const handleDelete = useCallback((entry: FormEntry) => {
    Alert.alert(
      ft('column_form_delete_title') || t('common.delete'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteFormEntry(entry.id)
            setEntries(prev => prev.filter(e => e.id !== entry.id))
          },
        },
      ]
    )
  }, [ft, t])

  const handleSave = useCallback(async () => {
    if (requiredKeysAny.length > 0) {
      const ok = requiredKeysAny.some(k => {
        const v = values[k]
        return typeof v === 'string' ? v.trim().length > 0 : v != null
      })
      if (!ok) {
        Alert.alert(
          ft('column_form_validation_title') || t('common.error'),
          ft('column_form_validation_msg'),
        )
        return
      }
    }
    setSaving(true)
    try {
      const id = editingId ?? generateId()
      await saveFormEntry({ id, module_id: moduleId, values })
      if (patient?.id && engagementEventType && !editingId) {
        await logEvent(patient.id, engagementEventType as EngagementEventType, {})
      }
      await loadEntries()
      setMode('list')
      setEditingId(null)
      setValues({})
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [editingId, values, moduleId, patient, engagementEventType, requiredKeysAny, loadEntries, ft, t])

  if (loading) {
    return <View style={cfStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── Mode entry
  if (mode === 'entry') {
    return (
      <KeyboardAvoidingView
        style={cfStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          style={cfStyles.scroll}
          contentContainerStyle={cfStyles.entryContent}
          keyboardShouldPersistTaps="handled"
        >
          {columns.map((col, idx) => {
            const accent = col.header.props['color'] ?? colors.primary
            const stepNumber = col.header.props['step_number'] ?? String(idx + 1)
            const hintCode = col.header.props['hint_code']
            const titleText = col.header.text_code ? t(col.header.text_code) : ''
            const hintText = hintCode ? t(hintCode) : ''
            return (
              <View
                key={col.sectionId}
                style={[cfStyles.section, { borderLeftColor: accent }]}
                testID={`column-${col.sectionId}`}
              >
                <View style={cfStyles.sectionHeader}>
                  <View style={[cfStyles.sectionBadge, { backgroundColor: accent }]}>
                    <Text style={cfStyles.sectionBadgeText}>{stepNumber}</Text>
                  </View>
                  <View style={cfStyles.sectionHeaderText}>
                    {titleText ? <Text style={[cfStyles.sectionTitle, { color: accent }]}>{titleText}</Text> : null}
                    {hintText ? <Text style={cfStyles.sectionHint}>{hintText}</Text> : null}
                  </View>
                </View>
                <View style={cfStyles.sectionBody}>
                  {col.children.map(child => {
                    const key = child.props['key']
                    if (!key) return null
                    const labelOrPlaceholder = child.text_code ? t(child.text_code) : ''
                    if (child.field_type === 'column_text_field') {
                      const multiline = (child.props['multiline'] ?? '1') !== '0'
                      const minHeight = parseInt(child.props['min_height'] ?? (multiline ? '72' : '0'), 10)
                      const value = String(values[key] ?? '')
                      return (
                        <TextInput
                          key={child.id}
                          style={[cfStyles.textInput, multiline && minHeight > 0 && { minHeight }]}
                          placeholder={labelOrPlaceholder}
                          placeholderTextColor={colors.textMuted}
                          value={value}
                          onChangeText={(v) => setValues(prev => ({ ...prev, [key]: v }))}
                          multiline={multiline}
                          textAlignVertical={multiline ? 'top' : 'center'}
                          testID={`field-${key}`}
                        />
                      )
                    }
                    if (child.field_type === 'column_slider_field') {
                      const min = parseInt(child.props['min'] ?? '0', 10)
                      const max = parseInt(child.props['max'] ?? '100', 10)
                      const step = parseInt(child.props['step'] ?? '10', 10)
                      const sliderColor = child.props['color'] ?? accent
                      const steps = (min === 0 && max === 100 && step === 10)
                        ? PIP_STEPS_0_100
                        : buildPipSteps(min, max, step)
                      const numValue = typeof values[key] === 'number' ? (values[key] as number) : Math.round((min + max) / 2)
                      return (
                        <View key={child.id} testID={`slider-${key}`}>
                          <PipPicker
                            label={labelOrPlaceholder}
                            value={numValue}
                            color={sliderColor}
                            steps={steps}
                            variant="track"
                            showEndLabels
                            onPress={(v) => setValues(prev => ({ ...prev, [key]: v }))}
                          />
                        </View>
                      )
                    }
                    return null
                  })}
                </View>
              </View>
            )
          })}
        </ScrollView>
        <View style={cfStyles.footer}>
          <Pressable
            style={cfStyles.cancelBtn}
            onPress={handleCancelEntry}
            accessibilityRole="button"
            testID="cancel-entry"
          >
            <Text style={cfStyles.cancelBtnText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[cfStyles.saveBtn, saving && cfStyles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={ft('column_form_save_label') || t('common.save')}
            testID="save-entry"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
                <Text style={cfStyles.saveBtnText}>{ft('column_form_save_label') || t('common.save')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── Mode list
  return (
    <View style={cfStyles.container}>
      <ScrollView
        style={cfStyles.scroll}
        contentContainerStyle={cfStyles.listContent}
      >
        {entries.length === 0 ? (
          <View style={cfStyles.empty} testID="list-empty">
            <MaterialCommunityIcons name="thought-bubble-outline" size={52} color={colors.border} />
            {ft('column_form_empty_title') ? (
              <Text style={cfStyles.emptyTitle}>{ft('column_form_empty_title')}</Text>
            ) : null}
            {ft('column_form_empty_text') ? (
              <Text style={cfStyles.emptyText}>{ft('column_form_empty_text')}</Text>
            ) : null}
          </View>
        ) : (
          <View style={cfStyles.list}>
            {entries.map(entry => {
              const dateLabel = formatDateFull(entry.created_at)
              return (
                <View key={entry.id} style={cfStyles.recordCard} testID={`record-${entry.id}`}>
                  <View style={cfStyles.recordHeader}>
                    <Text style={cfStyles.recordDate}>{dateLabel}</Text>
                    <View style={cfStyles.recordActions}>
                      <Pressable
                        onPress={() => handleEdit(entry)}
                        hitSlop={8}
                        accessibilityLabel={t('common.modify')}
                        testID={`edit-${entry.id}`}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(entry)}
                        hitSlop={8}
                        accessibilityLabel={t('common.delete')}
                        testID={`delete-${entry.id}`}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  </View>
                  {columns.map(col => {
                    const textChildren = col.children.filter(c => c.field_type === 'column_text_field')
                    const sliderChildren = col.children.filter(c => c.field_type === 'column_slider_field')
                    const accent = col.header.props['color'] ?? colors.primary
                    return textChildren.map(child => {
                      const key = child.props['key']
                      if (!key) return null
                      const value = entry.values[key]
                      if (typeof value !== 'string' || !value) return null
                      // Trouve un slider associé (intensité/croyance) dans la même colonne pour annoter
                      const slider = sliderChildren[0]
                      const sliderKey = slider?.props['key']
                      const sliderVal = sliderKey ? entry.values[sliderKey] : null
                      return (
                        <View key={child.id} style={cfStyles.recordRow}>
                          <View style={[cfStyles.recordDot, { backgroundColor: accent }]} />
                          <Text style={cfStyles.recordText} numberOfLines={2}>
                            {value}
                            {typeof sliderVal === 'number' ? (
                              <Text style={cfStyles.recordIntensity}> ({sliderVal}%)</Text>
                            ) : null}
                          </Text>
                        </View>
                      )
                    })
                  })}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
      <View style={cfStyles.footer}>
        <Pressable
          style={cfStyles.newBtn}
          onPress={handleNew}
          accessibilityRole="button"
          accessibilityLabel={ft('column_form_new_btn_label') || t('common.add')}
          testID="new-entry"
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
          <Text style={cfStyles.newBtnText}>{ft('column_form_new_btn_label') || t('common.add')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ─── Layout — sélecteur d'arbre (emotion_wheel…) ────────────────────────────
//
// Pattern « sélection hiérarchique guidée » : un arbre de noeuds modélisé
// via parent_field_id, navigation niveau par niveau, intensité brute
// optionnelle (1–N), notes libres optionnelles. Persistance dans la table
// SQLite générique tree_selections.
// Conformité MDR 2017/745 : aucun seuil interprétatif, juste affichage des
// déclarations brutes du patient.

interface TreeNode {
  id: string
  text_code: string | null
  color?: string
  icon?: string
  children: TreeNode[]
}

const DEFAULT_INTENSITY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

function buildTreeNodes(fields: ContentField[]): TreeNode[] {
  const convert = (f: ContentField): TreeNode => ({
    id: f.id,
    text_code: f.text_code,
    color: f.props['color'],
    icon: f.props['icon'],
    children: (f.children ?? [])
      .filter(c => c.field_type === 'tree_node')
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(convert),
  })
  return fields
    .filter(f => f.field_type === 'tree_node' && f.parent_field_id == null)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(convert)
}

function resolvePathLabel(node: TreeSelectionPathNode, t: (key: string) => string): string {
  if (node.text_code) return t(node.text_code)
  if (node.label) return node.label
  return node.id
}

function intensityValuesFor(min: number, max: number): number[] {
  if (min === 1 && max === 10) return [...DEFAULT_INTENSITY_VALUES]
  const result: number[] = []
  for (let v = min; v <= max; v += 1) result.push(v)
  return result
}

function TreeSelectorLayout({ fields, moduleId }: {
  fields: ContentField[]
  moduleId: string
}) {
  const t = useModuleT()
  // ── Résolution des champs DB-driven
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const configField = fields.find(f => f.field_type === 'tree_selector_config')
  const enableIntensity = (configField?.props['enable_intensity'] ?? '0') === '1'
  const enableNotes = (configField?.props['enable_notes'] ?? '0') === '1'
  const intensityMin = parseInt(configField?.props['intensity_min'] ?? '1', 10)
  const intensityMax = parseInt(configField?.props['intensity_max'] ?? '10', 10)
  const intensityValues = useMemo(
    () => intensityValuesFor(intensityMin, intensityMax),
    [intensityMin, intensityMax]
  )

  const nodes = useMemo(() => buildTreeNodes(fields), [fields])

  // ── State
  const [mode, setMode] = useState<'history' | 'selection' | 'intensity' | 'notes'>('history')
  const [path, setPath] = useState<TreeNode[]>([])
  const [intensity, setIntensity] = useState<number>(Math.round((intensityMin + intensityMax) / 2))
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState<TreeSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadEntries = useCallback(async () => {
    const data = await getAllTreeSelections(moduleId)
    setEntries(data)
    setLoading(false)
  }, [moduleId])

  useEffect(() => { void loadEntries() }, [loadEntries])

  // ── Couleur courante : couleur du noeud le plus profond ayant une couleur
  const accentColor = useMemo(() => {
    for (let i = path.length - 1; i >= 0; i -= 1) {
      if (path[i].color) return path[i].color!
    }
    return colors.primary
  }, [path])

  // ── Noeuds visibles à l'étape courante : enfants du dernier sélectionné, ou racine
  const currentNodes = useMemo(() => {
    if (path.length === 0) return nodes
    return path[path.length - 1].children
  }, [nodes, path])

  // ── Titres d'étape par niveau (le titre du niveau 2 est le label parent)
  const level = path.length + 1 // 1 quand path vide
  const stepTitle = useMemo(() => {
    if (level === 2 && path.length >= 1) {
      return path[0].text_code ? t(path[0].text_code) : ''
    }
    return ft(`tree_selector_step_${level}_title`)
  }, [level, path, ft, t])
  const stepHint = ft(`tree_selector_step_${level}_hint`)

  // ── Navigation
  const handleStartNew = useCallback(() => {
    setPath([])
    setIntensity(Math.round((intensityMin + intensityMax) / 2))
    setNotes('')
    setMode('selection')
  }, [intensityMin, intensityMax])

  const handleSelectNode = useCallback((node: TreeNode) => {
    const newPath = [...path, node]
    if (node.children.length > 0) {
      setPath(newPath)
      return
    }
    // Feuille atteinte
    setPath(newPath)
    if (enableIntensity) {
      setMode('intensity')
    } else if (enableNotes) {
      setMode('notes')
    } else {
      // Auto-save quand pas d'étapes supplémentaires
      void persistEntry(newPath, null, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enableIntensity, enableNotes])

  const handleBack = useCallback(() => {
    if (mode === 'notes' && enableIntensity) { setMode('intensity'); return }
    if (mode === 'notes' || mode === 'intensity') { setMode('selection'); return }
    if (path.length > 0) {
      setPath(prev => prev.slice(0, -1))
      return
    }
    setMode('history')
  }, [mode, path, enableIntensity])

  const handleCancel = useCallback(() => {
    setPath([])
    setMode('history')
  }, [])

  const persistEntry = useCallback(async (
    finalPath: TreeNode[],
    finalIntensity: number | null,
    finalNotes: string,
  ) => {
    if (finalPath.length === 0) return
    setSaving(true)
    try {
      const leaf = finalPath[finalPath.length - 1]
      await saveTreeSelection({
        id: generateId(),
        module_id: moduleId,
        selected_id: leaf.id,
        selected_label: leaf.text_code,
        path: finalPath.map(n => ({
          id: n.id,
          text_code: n.text_code ?? undefined,
          color: n.color,
          icon: n.icon,
        })),
        intensity: finalIntensity,
        notes: finalNotes.trim() || null,
      })
      await loadEntries()
      setPath([])
      setIntensity(Math.round((intensityMin + intensityMax) / 2))
      setNotes('')
      setMode('history')
    } finally {
      setSaving(false)
    }
  }, [moduleId, loadEntries, intensityMin, intensityMax])

  const handleConfirmIntensity = useCallback(() => {
    if (enableNotes) {
      setMode('notes')
      return
    }
    void persistEntry(path, intensity, '')
  }, [enableNotes, persistEntry, path, intensity])

  const handleSaveFinal = useCallback(() => {
    void persistEntry(path, enableIntensity ? intensity : null, notes)
  }, [persistEntry, path, enableIntensity, intensity, notes])

  const handleDelete = useCallback((entry: TreeSelection) => {
    Alert.alert(
      ft('tree_selector_delete_title') || t('common.delete'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTreeSelection(entry.id)
            setEntries(prev => prev.filter(e => e.id !== entry.id))
          },
        },
      ]
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  if (loading) {
    return <View style={tsStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── Mode historique ────────────────────────────────────────────────────────
  if (mode === 'history') {
    const introText = ft('tree_selector_intro')
    const newBtnLabel = ft('tree_selector_new_btn') || t('common.add')
    const historyLabel = ft('tree_selector_history_label')
    const emptyTitle = ft('tree_selector_empty_title')
    const emptyText = ft('tree_selector_empty_text')

    return (
      <View style={tsStyles.container}>
        <Pressable
          style={tsStyles.startBtn}
          onPress={handleStartNew}
          accessibilityRole="button"
          accessibilityLabel={newBtnLabel}
          testID="start-new-button"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.white} />
          <Text style={tsStyles.startBtnText}>{newBtnLabel}</Text>
        </Pressable>

        <ScrollView contentContainerStyle={tsStyles.historyContent}>
          {introText ? (
            <View style={tsStyles.introCard} testID="intro-card">
              <MaterialCommunityIcons name="palette" size={22} color={colors.primary} />
              <Text style={tsStyles.introText}>{introText}</Text>
            </View>
          ) : null}

          {entries.length === 0 ? (
            <View style={tsStyles.empty} testID="list-empty">
              <MaterialCommunityIcons name="palette-outline" size={52} color={colors.border} />
              {emptyTitle ? <Text style={tsStyles.emptyTitle}>{emptyTitle}</Text> : null}
              {emptyText ? <Text style={tsStyles.emptyText}>{emptyText}</Text> : null}
            </View>
          ) : (
            <View style={tsStyles.section}>
              {historyLabel ? (
                <Text style={tsStyles.sectionLabel}>{historyLabel} ({entries.length})</Text>
              ) : null}
              {entries.map(entry => {
                const rootNode = entry.path[0]
                const cardColor = rootNode?.color ?? colors.primary
                const cardIcon = (rootNode?.icon ?? 'palette-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
                const labels = entry.path.map(n => resolvePathLabel(n, t)).filter(Boolean)
                return (
                  <View
                    key={entry.id}
                    style={[tsStyles.entryCard, { borderLeftColor: cardColor }]}
                    testID={`entry-card-${entry.id}`}
                  >
                    <View style={tsStyles.entryHeader}>
                      <View style={[tsStyles.entryIcon, { backgroundColor: cardColor + '1A' }]}>
                        <MaterialCommunityIcons name={cardIcon} size={20} color={cardColor} />
                      </View>
                      <View style={tsStyles.entryLabels}>
                        {labels[0] ? (
                          <Text style={[tsStyles.entryPrimary, { color: cardColor }]}>{labels[0]}</Text>
                        ) : null}
                        {labels.length > 1 ? (
                          <Text style={tsStyles.entrySecondary}>
                            {labels.slice(1).join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                      <View style={tsStyles.entryRight}>
                        {entry.intensity != null ? (
                          <View style={[tsStyles.intensityBadge, { backgroundColor: cardColor + '1A' }]}>
                            <Text style={[tsStyles.intensityText, { color: cardColor }]}>
                              {entry.intensity}/{intensityMax}
                            </Text>
                          </View>
                        ) : null}
                        <Pressable
                          onPress={() => handleDelete(entry)}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}
                          hitSlop={8}
                          testID={`delete-${entry.id}`}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                    {entry.notes ? (
                      <Text style={tsStyles.entryNotes} numberOfLines={2}>{entry.notes}</Text>
                    ) : null}
                    <Text style={tsStyles.entryDate}>{formatDateTime(entry.created_at)}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Mode sélection (navigation dans l'arbre) ───────────────────────────────
  if (mode === 'selection') {
    const breadcrumb = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' › ')
    return (
      <View style={tsStyles.container}>
        <View style={tsStyles.header}>
          <Pressable
            onPress={handleBack}
            style={tsStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            testID="back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={tsStyles.progressContainer}>
            <View style={tsStyles.progressTrack}>
              <View style={[tsStyles.progressFill, {
                width: `${(level / Math.max(level, 3)) * 100}%`,
                backgroundColor: accentColor,
              }]} />
            </View>
            {breadcrumb ? (
              <Text style={tsStyles.progressLabel} numberOfLines={1}>{breadcrumb}</Text>
            ) : null}
          </View>
        </View>

        <ScrollView contentContainerStyle={tsStyles.selectionContent}>
          {stepTitle ? <Text style={tsStyles.stepTitle}>{stepTitle}</Text> : null}
          {stepHint ? <Text style={tsStyles.stepHint}>{stepHint}</Text> : null}

          {level === 1 ? (
            <View style={tsStyles.gridContainer} testID="level-1-grid">
              {currentNodes.map(node => {
                const nodeColor = node.color ?? colors.primary
                const nodeIcon = (node.icon ?? 'circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
                const label = node.text_code ? t(node.text_code) : ''
                return (
                  <Pressable
                    key={node.id}
                    style={[tsStyles.primaryCard, { borderColor: nodeColor }]}
                    onPress={() => handleSelectNode(node)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={`node-${node.id}`}
                  >
                    <View style={[tsStyles.primaryIconCircle, { backgroundColor: nodeColor + '1A' }]}>
                      <MaterialCommunityIcons name={nodeIcon} size={28} color={nodeColor} />
                    </View>
                    <Text style={[tsStyles.primaryLabel, { color: nodeColor }]}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View style={tsStyles.listContainer} testID={`level-${level}-list`}>
              {currentNodes.map(node => {
                const nodeColor = node.color ?? accentColor
                const label = node.text_code ? t(node.text_code) : ''
                return (
                  <Pressable
                    key={node.id}
                    style={[tsStyles.optionCard, { borderLeftColor: nodeColor }]}
                    onPress={() => handleSelectNode(node)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={`node-${node.id}`}
                  >
                    <Text style={[tsStyles.optionLabel, { color: nodeColor }]}>{label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </Pressable>
                )
              })}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Mode intensité ─────────────────────────────────────────────────────────
  if (mode === 'intensity') {
    const intensityTitle = ft('tree_selector_intensity_title')
    const intensityHint = ft('tree_selector_intensity_hint')
    const continueLabel = ft('tree_selector_continue_btn') || t('common.continue')
    return (
      <View style={tsStyles.container}>
        <View style={tsStyles.header}>
          <Pressable
            onPress={handleBack}
            style={tsStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            testID="back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={tsStyles.selectionContent}>
          {intensityTitle ? <Text style={tsStyles.stepTitle}>{intensityTitle}</Text> : null}
          {intensityHint ? <Text style={tsStyles.stepHint}>{intensityHint}</Text> : null}

          <View style={tsStyles.intensityCard} testID="intensity-card">
            <View style={[tsStyles.intensityDisplay, { backgroundColor: accentColor + '1A' }]}>
              <Text style={[tsStyles.intensityValue, { color: accentColor }]} testID="intensity-value">
                {intensity}
              </Text>
              <Text style={tsStyles.intensityMax}>/{intensityMax}</Text>
            </View>
            <View style={tsStyles.intensityBtns}>
              {intensityValues.map(v => {
                const isActive = intensity === v
                return (
                  <Pressable
                    key={v}
                    style={[
                      tsStyles.intensityBtn,
                      isActive && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}
                    onPress={() => setIntensity(v)}
                    accessibilityRole="button"
                    accessibilityLabel={String(v)}
                    testID={`intensity-btn-${v}`}
                  >
                    <Text style={[
                      tsStyles.intensityBtnText,
                      isActive && tsStyles.intensityBtnTextActive,
                    ]}>{v}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Pressable
            style={[tsStyles.continueBtn, { backgroundColor: accentColor }]}
            onPress={handleConfirmIntensity}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
            testID="continue-intensity"
          >
            <Text style={tsStyles.continueBtnText}>{continueLabel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
          </Pressable>
        </ScrollView>
      </View>
    )
  }

  // ── Mode notes ─────────────────────────────────────────────────────────────
  const notesTitle = ft('tree_selector_notes_title')
  const notesHint = ft('tree_selector_notes_hint')
  const notesPlaceholder = ft('tree_selector_notes_placeholder')
  const saveLabel = ft('tree_selector_save_btn') || t('common.save')
  const summary = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' — ')

  return (
    <KeyboardAvoidingView
      style={tsStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={tsStyles.header}>
        <Pressable
          onPress={handleBack}
          style={tsStyles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          testID="back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={tsStyles.selectionContent} keyboardShouldPersistTaps="handled">
        {notesTitle ? <Text style={tsStyles.stepTitle}>{notesTitle}</Text> : null}
        {notesHint ? <Text style={tsStyles.stepHint}>{notesHint}</Text> : null}

        {summary ? (
          <View style={[tsStyles.summaryCard, { borderLeftColor: accentColor }]} testID="summary-card">
            <Text style={[tsStyles.summaryPrimary, { color: accentColor }]}>{summary}</Text>
            {enableIntensity ? (
              <Text style={tsStyles.summaryMeta}>{intensity}/{intensityMax}</Text>
            ) : null}
          </View>
        ) : null}

        <TextInput
          style={tsStyles.notesInput}
          placeholder={notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel={notesPlaceholder}
          testID="notes-input"
        />

        <View style={tsStyles.actionsRow}>
          <Pressable
            style={tsStyles.cancelBtn}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            testID="cancel-entry"
          >
            <Text style={tsStyles.cancelBtnText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[tsStyles.saveBtn, { backgroundColor: accentColor }, saving && tsStyles.btnDisabled]}
            onPress={handleSaveFinal}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            testID="save-entry"
          >
            <Text style={tsStyles.saveBtnText}>{saving ? '…' : saveLabel}</Text>
            {!saving && <MaterialCommunityIcons name="check" size={20} color={colors.white} />}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Layout — journal de sommeil (sleep_diary) ──────────────────────────────
//
// Pattern « journal quotidien horodaté » : 3 modes internes (list/entry/month),
// time pickers natifs, calcul d'efficacité du sommeil affiché en valeur brute,
// grille calendrier mensuelle. Persistance dans la table SQLite dédiée
// sleep_diary_entries (UNIQUE par date).
// Conformité MDR 2017/745 : aucun seuil interprétatif, juste affichage des
// valeurs brutes saisies par le patient. La couleur de la qualité est une
// convention d'affichage (4-5 étoiles = vert), pas une interprétation clinique.

const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

function toHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function fromHHMM(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function yesterdayDateStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = 1; i <= n; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return (day + 6) % 7
}

function sleepMinutes(entry: SleepEntry): number | null {
  if (!entry.bedtime || !entry.wake_time) return null
  const [bH, bM] = entry.bedtime.split(':').map(Number)
  const [wH, wM] = entry.wake_time.split(':').map(Number)
  let total = wH * 60 + wM - (bH * 60 + bM) - (entry.sleep_onset_minutes ?? 0)
  if (total < 0) total += 24 * 60
  return total
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

function qualityColorOf(quality: number | null, qualityWarning: number, qualityGood: number): string {
  if (quality === null) return colors.border
  if (quality >= qualityGood) return colors.success
  if (quality >= qualityWarning) return '#F59E0B'
  return colors.danger
}

function SleepJournalLayout({ fields }: { fields: ContentField[] }) {
  const t = useModuleT()

  const ft = useCallback((type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }, [fields, t])

  const configField = fields.find(f => f.field_type === 'sleep_journal_config')
  const historyDays = parseInt(configField?.props['history_days'] ?? '14', 10)
  const awakeningsMax = parseInt(configField?.props['awakenings_max'] ?? '20', 10)
  const onsetMaxMinutes = parseInt(configField?.props['onset_max_minutes'] ?? '180', 10)
  const awakDurationMaxMinutes = parseInt(configField?.props['awak_duration_max_minutes'] ?? '300', 10)
  const efficiencyGood = parseInt(configField?.props['efficiency_good'] ?? '85', 10)
  const efficiencyWarning = parseInt(configField?.props['efficiency_warning'] ?? '70', 10)
  const qualityMax = parseInt(configField?.props['quality_max'] ?? '5', 10)
  const qualityGoodThreshold = parseInt(configField?.props['quality_good_threshold'] ?? '4', 10)
  const qualityAvgThreshold = parseInt(configField?.props['quality_avg_threshold'] ?? '3', 10)

  const now = useMemo(() => new Date(), [])

  // ── State
  const [mode, setMode] = useState<'list' | 'entry' | 'month'>('list')
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Mode entry
  const [targetDate, setTargetDate] = useState<string>(yesterdayDateStr())
  const [existingId, setExistingId] = useState<string | null>(null)
  const [bedtime, setBedtime] = useState<Date>(() => { const d = new Date(); d.setHours(23, 0, 0, 0); return d })
  const [wakeTime, setWakeTime] = useState<Date>(() => { const d = new Date(); d.setHours(7, 0, 0, 0); return d })
  const [onsetMinutes, setOnsetMinutes] = useState(0)
  const [awakenings, setAwakenings] = useState(0)
  const [awakeningsDuration, setAwakeningsDuration] = useState(0)
  const [nightmares, setNightmares] = useState(false)
  const [quality, setQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [showBedtimePicker, setShowBedtimePicker] = useState(false)
  const [showWakePicker, setShowWakePicker] = useState(false)

  // Mode month
  const [monthYear, setMonthYear] = useState(now.getFullYear())
  const [monthNum, setMonthNum] = useState(now.getMonth() + 1)
  const [monthEntries, setMonthEntries] = useState<SleepEntry[]>([])

  // ── Loaders
  const loadEntries = useCallback(async () => {
    const data = await getAllSleepEntries()
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { void loadEntries() }, [loadEntries])

  const loadMonth = useCallback(async (year: number, monthVal: number) => {
    const data = await getSleepEntriesForMonth(toYearMonth(year, monthVal))
    setMonthEntries(data)
  }, [])

  // ── Navigation
  const handleOpenEntry = useCallback(async (date: string) => {
    setTargetDate(date)
    const entry = await getSleepEntry(date)
    if (entry) {
      setExistingId(entry.id)
      if (entry.bedtime) setBedtime(fromHHMM(entry.bedtime))
      else { const d = new Date(); d.setHours(23, 0, 0, 0); setBedtime(d) }
      if (entry.wake_time) setWakeTime(fromHHMM(entry.wake_time))
      else { const d = new Date(); d.setHours(7, 0, 0, 0); setWakeTime(d) }
      setOnsetMinutes(entry.sleep_onset_minutes ?? 0)
      setAwakenings(entry.awakenings ?? 0)
      setAwakeningsDuration(entry.awakenings_duration_minutes ?? 0)
      setNightmares(entry.nightmares === 1)
      setQuality(entry.quality)
      setNotes(entry.notes ?? '')
    } else {
      setExistingId(null)
      const b = new Date(); b.setHours(23, 0, 0, 0); setBedtime(b)
      const w = new Date(); w.setHours(7, 0, 0, 0); setWakeTime(w)
      setOnsetMinutes(0)
      setAwakenings(0)
      setAwakeningsDuration(0)
      setNightmares(false)
      setQuality(null)
      setNotes('')
    }
    setMode('entry')
  }, [])

  const handleOpenMonth = useCallback(() => {
    void loadMonth(monthYear, monthNum)
    setMode('month')
  }, [loadMonth, monthYear, monthNum])

  const handleBackToList = useCallback(() => {
    void loadEntries()
    setMode('list')
  }, [loadEntries])

  // ── Save / delete
  const handleSave = useCallback(async () => {
    if (quality === null) {
      Alert.alert(
        ft('sleep_journal_quality_missing_title') || t('common.warning'),
        ft('sleep_journal_quality_missing_msg') || '',
      )
      return
    }
    setSaving(true)
    try {
      await saveSleepEntry({
        id: existingId ?? generateId(),
        date: targetDate,
        bedtime: toHHMM(bedtime),
        wake_time: toHHMM(wakeTime),
        sleep_onset_minutes: onsetMinutes,
        awakenings,
        awakenings_duration_minutes: awakeningsDuration,
        nightmares: nightmares ? 1 : 0,
        quality,
        notes: notes.trim() || null,
      })
      await loadEntries()
      setMode('list')
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, existingId, targetDate, bedtime, wakeTime, onsetMinutes, awakenings, awakeningsDuration, nightmares, notes, loadEntries, t])

  const handleDelete = useCallback(() => {
    if (!existingId) return
    Alert.alert(
      ft('sleep_journal_delete_title') || t('common.delete'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteSleepEntry(existingId)
            await loadEntries()
            setMode('list')
          },
        },
      ]
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId, loadEntries, t])

  // ── Month nav
  const goPrevMonth = useCallback(() => {
    let y = monthYear, m = monthNum
    if (m === 1) { y -= 1; m = 12 } else { m -= 1 }
    setMonthYear(y)
    setMonthNum(m)
    void loadMonth(y, m)
  }, [monthYear, monthNum, loadMonth])

  const goNextMonth = useCallback(() => {
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    if (monthYear > nowYear || (monthYear === nowYear && monthNum >= nowMonth)) return
    let y = monthYear, m = monthNum
    if (m === 12) { y += 1; m = 1 } else { m += 1 }
    setMonthYear(y)
    setMonthNum(m)
    void loadMonth(y, m)
  }, [monthYear, monthNum, loadMonth, now])

  // ── Sleep efficiency (computed live in entry mode)
  const liveSE = useMemo(
    () => computeSleepEfficiency(toHHMM(bedtime), toHHMM(wakeTime), onsetMinutes, awakeningsDuration),
    [bedtime, wakeTime, onsetMinutes, awakeningsDuration]
  )
  const seColor = liveSE === null ? colors.danger
    : liveSE >= efficiencyGood ? colors.success
    : liveSE >= efficiencyWarning ? '#F59E0B'
    : colors.danger

  if (loading) {
    return <View style={sjStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── MODE LIST ───────────────────────────────────────────────────────────
  if (mode === 'list') {
    const entryByDate: Record<string, SleepEntry> = {}
    for (const e of entries) entryByDate[e.date] = e
    const days = lastNDays(historyDays)
    const ctaTitle = ft('sleep_journal_cta_title')
    const monthlyLabel = ft('sleep_journal_monthly_button_label') || ft('sleep_journal_month_btn') || t('common.calendar')
    const listHeader = ft('sleep_journal_list_header')
    const incompleteLabel = ft('sleep_journal_incomplete_label')
    const emptyDayLabel = ft('sleep_journal_empty_day_label')

    return (
      <ScrollView style={sjStyles.container} contentContainerStyle={sjStyles.listContent} testID="sleep-journal-list">
        <View style={sjStyles.ctaContainer}>
          <Pressable
            style={sjStyles.ctaCard}
            onPress={() => handleOpenEntry(yesterdayDateStr())}
            accessibilityRole="button"
            testID="cta-yesterday"
          >
            <View style={sjStyles.ctaRow}>
              <MaterialCommunityIcons name="weather-night" size={32} color={colors.white} />
              <View style={sjStyles.ctaTexts}>
                {ctaTitle ? <Text style={sjStyles.ctaTitle}>{ctaTitle}</Text> : null}
                <Text style={sjStyles.ctaSubtitle}>{formatDateShort(yesterdayDateStr())}</Text>
              </View>
              <Text style={sjStyles.chevronWhite}>›</Text>
            </View>
          </Pressable>

          <Pressable
            style={sjStyles.monthCard}
            onPress={handleOpenMonth}
            accessibilityRole="button"
            testID="cta-month"
          >
            <View style={sjStyles.ctaRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
              <Text style={sjStyles.monthBtnText}>{monthlyLabel}</Text>
              <Text style={sjStyles.chevron}>›</Text>
            </View>
          </Pressable>
        </View>

        {listHeader ? <Text style={sjStyles.listHeader}>{listHeader}</Text> : null}

        {days.map(date => {
          const entry = entryByDate[date]
          const filled = entry != null
          return (
            <Pressable
              key={date}
              style={[sjStyles.dayRow, filled && sjStyles.dayRowFilled]}
              onPress={() => handleOpenEntry(date)}
              accessibilityRole="button"
              testID={`day-${date}`}
            >
              <View style={[sjStyles.dot, filled ? sjStyles.dotFilled : sjStyles.dotEmpty]} />
              <View style={sjStyles.dayInfo}>
                <Text style={[sjStyles.dayDate, filled && sjStyles.dayDateFilled]}>{formatDateShort(date)}</Text>
                {filled && entry.bedtime && entry.wake_time ? (
                  <View style={sjStyles.entryDetails}>
                    <Text style={sjStyles.entryMeta}>
                      {entry.bedtime} → {entry.wake_time}
                      {'  '}
                      <Text style={sjStyles.entryMetaStrong}>
                        ({computeSleepDuration(entry.bedtime, entry.wake_time, entry.sleep_onset_minutes)})
                      </Text>
                    </Text>
                    {entry.quality !== null ? (
                      <View style={sjStyles.starsRow}>
                        {Array.from({ length: qualityMax }, (_, i) => (
                          <MaterialCommunityIcons
                            key={i}
                            name={i < (entry.quality ?? 0) ? 'star' : 'star-outline'}
                            size={14}
                            color={i < (entry.quality ?? 0) ? colors.stars : colors.border}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : filled ? (
                  <Text style={sjStyles.entryMeta}>{incompleteLabel}</Text>
                ) : (
                  <Text style={sjStyles.emptyDay}>{emptyDayLabel}</Text>
                )}
              </View>
              <Text style={sjStyles.chevron}>›</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    )
  }

  // ── MODE MONTH ──────────────────────────────────────────────────────────
  if (mode === 'month') {
    const monthEntryByDate: Record<string, SleepEntry> = {}
    for (const e of monthEntries) monthEntryByDate[e.date] = e
    const totalDays = daysInMonth(monthYear, monthNum)
    const offset = firstWeekday(monthYear, monthNum)
    const cells: (number | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    const isCurrentMonth = monthYear === now.getFullYear() && monthNum === now.getMonth() + 1

    const filledEntries = monthEntries.filter(e => e.quality !== null)
    const sleepDurations = monthEntries.map(sleepMinutes).filter((m): m is number => m !== null)
    const avgSleep = sleepDurations.length > 0
      ? Math.round(sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length)
      : null
    const awakEntries = monthEntries.filter(e => e.awakenings != null)
    const avgAwakenings = awakEntries.length > 0
      ? Math.round((awakEntries.reduce((a, e) => a + (e.awakenings ?? 0), 0) / awakEntries.length) * 10) / 10
      : null
    const nightmaresCount = monthEntries.filter(e => e.nightmares === 1).length

    const monthLabel = new Date(monthYear, monthNum - 1, 1)
      .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const monthSummaryTitle = ft('sleep_journal_month_summary_title')
    const legendTitle = ft('sleep_journal_legend_title')

    return (
      <View style={sjStyles.container} testID="sleep-journal-month">
        <View style={sjStyles.monthNav}>
          <Pressable
            onPress={handleBackToList}
            style={sjStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={ft('sleep_journal_back_label') || t('common.back')}
            testID="month-back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={goPrevMonth} style={sjStyles.navBtn} accessibilityRole="button" testID="month-prev">
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
          </Pressable>
          <Text style={sjStyles.monthTitle}>{monthLabel}</Text>
          <Pressable
            onPress={goNextMonth}
            style={[sjStyles.navBtn, isCurrentMonth && sjStyles.navBtnDisabled]}
            accessibilityRole="button"
            testID="month-next"
            disabled={isCurrentMonth}
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={isCurrentMonth ? colors.border : colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={sjStyles.monthContent}>
          <View style={sjStyles.calendarCard}>
            <View style={sjStyles.calendarHeader}>
              {WEEKDAYS_SHORT.map((d, i) => (
                <Text key={i} style={sjStyles.weekday}>{d}</Text>
              ))}
            </View>
            {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
              <View key={rowIdx} style={sjStyles.calendarRow}>
                {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                  if (!day) return <View key={colIdx} style={sjStyles.calendarCell} />
                  const dateStr = `${toYearMonth(monthYear, monthNum)}-${String(day).padStart(2, '0')}`
                  const entry = monthEntryByDate[dateStr]
                  const isFuture = isCurrentMonth && day > now.getDate()
                  const isToday = isCurrentMonth && day === now.getDate()
                  const bg = entry
                    ? qualityColorOf(entry.quality, qualityAvgThreshold, qualityGoodThreshold)
                    : isFuture ? 'transparent' : colors.border
                  const hasNightmare = entry?.nightmares === 1
                  return (
                    <View key={colIdx} style={sjStyles.calendarCell}>
                      <View style={[sjStyles.dayDot, { backgroundColor: bg }, isToday && sjStyles.dayDotToday]}>
                        <Text style={[sjStyles.dayNum, entry ? sjStyles.dayNumFilled : isFuture ? sjStyles.dayNumFuture : null]}>
                          {day}
                        </Text>
                        {hasNightmare ? (
                          <View style={sjStyles.nightmareBadge}>
                            <MaterialCommunityIcons name="ghost" size={8} color={colors.white} />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>

          {monthSummaryTitle ? <Text style={sjStyles.sectionTitle}>{monthSummaryTitle}</Text> : null}
          <View style={sjStyles.statsGrid}>
            <View style={sjStyles.statCard}>
              <Text style={sjStyles.statValue}>{avgSleep !== null ? formatMinutes(avgSleep) : '–'}</Text>
              <Text style={sjStyles.statLabel}>{ft('sleep_journal_stat_avg_duration_label')}</Text>
            </View>
            <View style={sjStyles.statCard}>
              <Text style={sjStyles.statValue}>{avgAwakenings !== null ? String(avgAwakenings) : '–'}</Text>
              <Text style={sjStyles.statLabel}>{ft('sleep_journal_stat_avg_awakenings_label')}</Text>
            </View>
            <View style={sjStyles.statCard}>
              <Text style={sjStyles.statValue}>{`${filledEntries.length}/${totalDays}`}</Text>
              <Text style={sjStyles.statLabel}>{ft('sleep_journal_stat_nights_filled_label')}</Text>
            </View>
            <View style={sjStyles.statCard}>
              <Text style={sjStyles.statValue}>{String(nightmaresCount)}</Text>
              <Text style={sjStyles.statLabel}>{ft('sleep_journal_stat_nightmares_label')}</Text>
            </View>
          </View>

          {legendTitle ? <Text style={sjStyles.sectionTitle}>{legendTitle}</Text> : null}
          <View style={sjStyles.legendCard}>
            <View style={sjStyles.legendRow}>
              <View style={[sjStyles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={sjStyles.legendLabel}>{ft('sleep_journal_legend_good_label')}</Text>
            </View>
            <View style={sjStyles.legendRow}>
              <View style={[sjStyles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={sjStyles.legendLabel}>{ft('sleep_journal_legend_average_label')}</Text>
            </View>
            <View style={sjStyles.legendRow}>
              <View style={[sjStyles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={sjStyles.legendLabel}>{ft('sleep_journal_legend_bad_label')}</Text>
            </View>
            <View style={sjStyles.legendRow}>
              <View style={[sjStyles.legendDot, { backgroundColor: colors.border }]} />
              <Text style={sjStyles.legendLabel}>{ft('sleep_journal_legend_empty_label')}</Text>
            </View>
            <View style={sjStyles.legendRow}>
              <MaterialCommunityIcons name="ghost" size={13} color={colors.textMuted} />
              <Text style={sjStyles.legendLabel}>{ft('sleep_journal_legend_nightmare_label')}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── MODE ENTRY ──────────────────────────────────────────────────────────
  const onsetConv = (() => {
    if (onsetMinutes === 0) return null
    const h = Math.floor(onsetMinutes / 60)
    const m = onsetMinutes % 60
    if (h > 0 && m > 0) return `= ${h}h${String(m).padStart(2, '0')}`
    if (h > 0) return `= ${h}h00`
    return null
  })()
  const awakDurConv = (() => {
    if (awakeningsDuration === 0) return null
    const h = Math.floor(awakeningsDuration / 60)
    const m = awakeningsDuration % 60
    if (h > 0 && m > 0) return `= ${h}h${String(m).padStart(2, '0')}`
    if (h > 0) return `= ${h}h00`
    return null
  })()
  const qualityLabels = [
    ft('sleep_journal_quality_label_1') || ft('sleep_journal_quality_very_bad'),
    ft('sleep_journal_quality_label_2') || ft('sleep_journal_quality_bad'),
    ft('sleep_journal_quality_label_3') || ft('sleep_journal_quality_average'),
    ft('sleep_journal_quality_label_4') || ft('sleep_journal_quality_good'),
    ft('sleep_journal_quality_label_5') || ft('sleep_journal_quality_excellent'),
  ]
  const saveLabel = existingId
    ? (ft('sleep_journal_update_label') || t('common.update'))
    : (ft('sleep_journal_save_label') || t('common.save'))
  const tapModify = ft('sleep_journal_tap_to_modify_hint')
  const minutesUnit = ft('sleep_journal_minutes_unit') || 'min'

  return (
    <KeyboardAvoidingView
      style={sjStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
      testID="sleep-journal-entry"
    >
      <View style={sjStyles.entryHeaderBar}>
        <Pressable
          onPress={handleBackToList}
          style={sjStyles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={ft('sleep_journal_back_label') || t('common.back')}
          testID="entry-back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={sjStyles.entryContent} keyboardShouldPersistTaps="handled">
        <View style={sjStyles.dateHeader} testID="entry-date-header">
          <Text style={sjStyles.dateLabel}>{ft('sleep_journal_date_label')}</Text>
          <Text style={sjStyles.dateValue}>{formatDateFull(targetDate)}</Text>
        </View>

        <View style={sjStyles.section}>
          <Text style={sjStyles.sectionLabel}>{ft('sleep_journal_section_schedule_title')}</Text>
          <View style={sjStyles.card}>
            <View style={sjStyles.timeFieldGroup}>
              <Text style={sjStyles.fieldLabel}>{ft('sleep_journal_bedtime_label')}</Text>
              <TouchableOpacity
                style={sjStyles.timeBtn}
                onPress={() => setShowBedtimePicker(true)}
                accessibilityRole="button"
                testID="bedtime-btn"
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
                <Text style={sjStyles.timeValue}>{toHHMM(bedtime)}</Text>
                {tapModify ? <Text style={sjStyles.timeHint}>{tapModify}</Text> : null}
              </TouchableOpacity>
              {showBedtimePicker ? (
                <DateTimePicker
                  value={bedtime}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowBedtimePicker(false)
                    if (date) setBedtime(date)
                  }}
                />
              ) : null}
              {showBedtimePicker && Platform.OS === 'ios' ? (
                <Pressable style={sjStyles.confirmBtn} onPress={() => setShowBedtimePicker(false)}>
                  <Text style={sjStyles.confirmBtnText}>{ft('sleep_journal_confirm_label') || t('common.ok')}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={sjStyles.divider} />

            <View style={sjStyles.timeFieldGroup}>
              <Text style={sjStyles.fieldLabel}>{ft('sleep_journal_wake_time_label')}</Text>
              <TouchableOpacity
                style={sjStyles.timeBtn}
                onPress={() => setShowWakePicker(true)}
                accessibilityRole="button"
                testID="wake-time-btn"
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
                <Text style={sjStyles.timeValue}>{toHHMM(wakeTime)}</Text>
                {tapModify ? <Text style={sjStyles.timeHint}>{tapModify}</Text> : null}
              </TouchableOpacity>
              {showWakePicker ? (
                <DateTimePicker
                  value={wakeTime}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowWakePicker(false)
                    if (date) setWakeTime(date)
                  }}
                />
              ) : null}
              {showWakePicker && Platform.OS === 'ios' ? (
                <Pressable style={sjStyles.confirmBtn} onPress={() => setShowWakePicker(false)}>
                  <Text style={sjStyles.confirmBtnText}>{ft('sleep_journal_confirm_label') || t('common.ok')}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={sjStyles.divider} />

            <View style={sjStyles.timeFieldGroup}>
              <Text style={sjStyles.fieldLabel}>{ft('sleep_journal_onset_label')}</Text>
              <View style={sjStyles.minutesRow}>
                <TextInput
                  style={sjStyles.minutesInput}
                  value={onsetMinutes > 0 ? String(onsetMinutes) : ''}
                  onChangeText={(raw) => {
                    const parsed = parseInt(raw, 10)
                    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= onsetMaxMinutes) setOnsetMinutes(parsed)
                    else if (raw === '') setOnsetMinutes(0)
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.border}
                  maxLength={3}
                  returnKeyType="done"
                  testID="onset-input"
                />
                <Text style={sjStyles.minutesUnit}>{minutesUnit}</Text>
                {onsetConv ? <Text style={sjStyles.minutesConv}>{onsetConv}</Text> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={sjStyles.section}>
          <Text style={sjStyles.sectionLabel}>{ft('sleep_journal_section_awakenings_title')}</Text>
          <View style={sjStyles.card}>
            <View style={sjStyles.timeFieldGroup}>
              <Text style={sjStyles.fieldLabel}>{ft('sleep_journal_awakenings_label')}</Text>
              <View style={sjStyles.counterRow}>
                <Pressable
                  style={[sjStyles.counterBtn, awakenings <= 0 && sjStyles.counterBtnDisabled]}
                  onPress={() => awakenings > 0 && setAwakenings(awakenings - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="-"
                  testID="awakenings-minus"
                >
                  <Text style={sjStyles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={sjStyles.counterValue} testID="awakenings-value">{awakenings}</Text>
                <Pressable
                  style={[sjStyles.counterBtn, awakenings >= awakeningsMax && sjStyles.counterBtnDisabled]}
                  onPress={() => awakenings < awakeningsMax && setAwakenings(awakenings + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="+"
                  testID="awakenings-plus"
                >
                  <Text style={sjStyles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={sjStyles.divider} />

            <View style={sjStyles.timeFieldGroup}>
              <Text style={sjStyles.fieldLabel}>{ft('sleep_journal_awakenings_duration_label')}</Text>
              <View style={sjStyles.minutesRow}>
                <TextInput
                  style={sjStyles.minutesInput}
                  value={awakeningsDuration > 0 ? String(awakeningsDuration) : ''}
                  onChangeText={(raw) => {
                    const parsed = parseInt(raw, 10)
                    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= awakDurationMaxMinutes) setAwakeningsDuration(parsed)
                    else if (raw === '') setAwakeningsDuration(0)
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.border}
                  maxLength={3}
                  returnKeyType="done"
                  testID="awak-duration-input"
                />
                <Text style={sjStyles.minutesUnit}>{minutesUnit}</Text>
                {awakDurConv ? <Text style={sjStyles.minutesConv}>{awakDurConv}</Text> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={sjStyles.section}>
          <Text style={sjStyles.sectionLabel}>{ft('sleep_journal_section_nightmares_title')}</Text>
          <Pressable
            style={[sjStyles.card, sjStyles.toggleRow]}
            onPress={() => setNightmares(!nightmares)}
            accessibilityRole="switch"
            accessibilityState={{ checked: nightmares }}
            testID="nightmares-toggle"
          >
            <View style={sjStyles.toggleLeft}>
              <MaterialCommunityIcons
                name="ghost"
                size={22}
                color={nightmares ? colors.danger : colors.textMuted}
              />
              <Text style={sjStyles.toggleLabel}>{ft('sleep_journal_nightmares_label')}</Text>
            </View>
            <View style={[sjStyles.switchTrack, nightmares && sjStyles.switchTrackOn]}>
              <View style={[sjStyles.switchThumb, nightmares && sjStyles.switchThumbOn]} />
            </View>
          </Pressable>
        </View>

        <View style={sjStyles.section}>
          <Text style={sjStyles.sectionLabel}>{ft('sleep_journal_section_quality_title')}</Text>
          <View style={sjStyles.card}>
            <Text style={sjStyles.fieldLabel}>{ft('sleep_journal_quality_label')}</Text>
            <View style={sjStyles.starsBig}>
              {Array.from({ length: qualityMax }, (_, i) => {
                const n = i + 1
                return (
                  <Pressable
                    key={n}
                    onPress={() => setQuality(n)}
                    accessibilityRole="button"
                    accessibilityLabel={String(n)}
                    testID={`quality-star-${n}`}
                  >
                    <MaterialCommunityIcons
                      name={n <= (quality ?? 0) ? 'star' : 'star-outline'}
                      size={36}
                      color={n <= (quality ?? 0) ? colors.stars : colors.border}
                    />
                  </Pressable>
                )
              })}
            </View>
            {quality !== null && qualityLabels[quality - 1] ? (
              <Text style={sjStyles.qualityLabel}>{qualityLabels[quality - 1]}</Text>
            ) : null}
          </View>
        </View>

        <View style={sjStyles.section}>
          <Text style={sjStyles.sectionLabel}>{ft('sleep_journal_section_notes_title') || ft('sleep_journal_notes_label')}</Text>
          <View style={sjStyles.card}>
            <TextInput
              style={sjStyles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={ft('sleep_journal_notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </View>

        {liveSE !== null ? (
          <View style={[sjStyles.seCard, { borderColor: seColor }]} testID="sleep-efficiency">
            <View style={sjStyles.seRow}>
              <MaterialCommunityIcons name="sleep" size={20} color={seColor} />
              <Text style={sjStyles.seTitle}>{ft('sleep_journal_efficiency_label')}</Text>
              <Text style={[sjStyles.seScore, { color: seColor }]}>{liveSE} %</Text>
            </View>
          </View>
        ) : null}

        <Pressable
          style={[sjStyles.saveBtn, saving && sjStyles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          testID="save-button"
        >
          <Text style={sjStyles.saveBtnText}>{saving ? '…' : saveLabel}</Text>
          {!saving ? <MaterialCommunityIcons name="check" size={20} color={colors.white} /> : null}
        </Pressable>
        {existingId ? (
          <Pressable
            style={sjStyles.deleteBtn}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={ft('sleep_journal_delete_label') || t('common.delete')}
            testID="delete-button"
          >
            <Text style={sjStyles.deleteBtnText}>{ft('sleep_journal_delete_label') || t('common.delete')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
      return <StepsLayout sections={sections} footer={footer} />
    }
    return <CardsLayout sections={sections} />
  }

  if (preview_kind === 'fields') {
    const fieldRows = contentFields.filter(f => f.field_type === 'field_row')
    return <FieldsLayout fields={fieldRows} footer={footer} />
  }

  if (preview_kind === 'patient_scenario') {
    return (
      <PatientScenarioLayout
        fields={visibleFields}
        patientConfig={patientConfig ?? null}
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
    return <Grid2x2Layout sections={sections} footer={footer} />
  }

  if (preview_kind === 'timed_tap_exercise') {
    return <TimedTapExerciseLayout fields={visibleFields} />
  }

  if (preview_kind === 'daily_checkin') {
    return <DailyCheckinLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  }

  if (preview_kind === 'column_form') {
    return <ColumnFormLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  }

  if (preview_kind === 'tree_selector') {
    return <TreeSelectorLayout fields={visibleFields} moduleId={moduleId ?? ''} />
  }

  if (preview_kind === 'sleep_journal') {
    return <SleepJournalLayout fields={visibleFields} />
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

const dcStyles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll:           { flex: 1 },
  content:          { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  // ── Onglets
  tabs: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm + 2, gap: spacing.xs,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive:        { borderBottomColor: colors.primary },
  tabText:          { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  tabTextActive:    { color: colors.primary, fontWeight: '700' },
  tabBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  tabBadgeText:     { color: colors.white, fontSize: 11, fontWeight: '700' },
  // ── Date du jour
  dateHeader: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, gap: 2,
  },
  dateLabel: {
    fontSize: 13, fontWeight: '600', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateValue:        { fontSize: 18, fontWeight: '700', color: colors.text },
  // ── Badge "déjà saisi"
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.successLight, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start',
  },
  savedBadgeText:   { fontSize: 13, color: colors.success, fontWeight: '600' },
  // ── Question + boutons de statut
  questionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  questionText:     { fontSize: 15, fontWeight: '500', color: colors.text },
  statusRow:        { flexDirection: 'row', gap: spacing.sm },
  statusBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  statusLabel:      { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  // ── Notes
  notesSection:     { gap: spacing.xs },
  notesLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notesInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    fontSize: 14, color: colors.text, minHeight: 80,
  },
  // ── Liste historique
  list:             { gap: spacing.sm },
  empty:            { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  histCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  histMain:         { flex: 1, gap: 4 },
  histDate:         { fontSize: 13, fontWeight: '600', color: colors.text },
  histBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
  },
  histBadgeText:    { fontSize: 12, fontWeight: '600' },
  histNotes:        { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  // ── Footer
  footer: {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  saveBtnDisabled:  { opacity: 0.6 },
  saveBtnText:      { color: colors.white, fontSize: 16, fontWeight: '700' },
})

const cfStyles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll:            { flex: 1 },
  // ── Liste
  listContent:       { padding: spacing.md, paddingBottom: spacing.lg },
  list:              { gap: spacing.sm },
  empty: {
    alignItems: 'center', paddingVertical: spacing.xl * 2, gap: spacing.md,
  },
  emptyTitle:        { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: {
    fontSize: 15, color: colors.textMuted, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: spacing.lg,
  },
  recordCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xs,
  },
  recordDate:        { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  recordActions:     { flexDirection: 'row', gap: spacing.sm },
  recordRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  recordDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  recordText:        { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  recordIntensity:   { color: colors.textMuted, fontSize: 13 },
  // ── Entrée
  entryContent:      { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  section: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.md, paddingBottom: spacing.sm,
  },
  sectionBadge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionBadgeText:  { fontSize: 13, fontWeight: '700', color: colors.white },
  sectionHeaderText: { flex: 1 },
  sectionTitle:      { fontSize: 15, fontWeight: '700' },
  sectionHint:       { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  sectionBody: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm,
  },
  textInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, fontSize: 14, color: colors.text,
    backgroundColor: colors.background,
  },
  // ── Footer
  footer: {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md, flexDirection: 'row', gap: spacing.sm,
  },
  saveBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  saveBtnText:       { color: colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText:     { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  newBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  newBtnText:        { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnDisabled:       { opacity: 0.6 },
})

const tsStyles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // ── Bouton démarrer (mode historique)
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  startBtnText:     { fontSize: 16, fontWeight: '700', color: colors.white },
  // ── Historique
  historyContent:   { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  introText:        { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  section:          { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  empty:            { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle:       { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  // ── Carte d'entrée
  entryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  entryHeader:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  entryIcon: {
    width: 36, height: 36, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  entryLabels:      { flex: 1, gap: 2 },
  entryPrimary:     { fontSize: 15, fontWeight: '700' },
  entrySecondary:   { fontSize: 13, color: colors.textMuted },
  entryRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  intensityBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
  },
  intensityText:    { fontSize: 12, fontWeight: '700' },
  entryNotes: {
    fontSize: 13, color: colors.textMuted, fontStyle: 'italic',
    lineHeight: 18, marginTop: spacing.xs,
  },
  entryDate:        { fontSize: 11, color: colors.border, marginTop: 2 },
  // ── En-tête mode sélection
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm,
  },
  backBtn:          { padding: spacing.xs },
  progressContainer:{ flex: 1, gap: spacing.xs },
  progressTrack: {
    height: 4, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill:     { height: '100%', borderRadius: radius.full },
  progressLabel:    { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  // ── Sélection
  selectionContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stepTitle:        { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  stepHint:         { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md },
  gridContainer:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.sm, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  primaryIconCircle: {
    width: 56, height: 56, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryLabel:     { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  listContainer:    { gap: spacing.sm },
  optionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  optionLabel:      { fontSize: 16, fontWeight: '600' },
  // ── Intensité
  intensityCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    marginBottom: spacing.md,
  },
  intensityDisplay: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg,
  },
  intensityValue:   { fontSize: 48, fontWeight: '800' },
  intensityMax:     { fontSize: 20, color: colors.textMuted, fontWeight: '600' },
  intensityBtns: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center',
  },
  intensityBtn: {
    width: 44, height: 44, borderRadius: radius.full, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  intensityBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  intensityBtnTextActive: { color: colors.white },
  continueBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  continueBtnText:  { fontSize: 16, fontWeight: '700', color: colors.white },
  // ── Notes
  summaryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, gap: spacing.xs, marginBottom: spacing.md,
  },
  summaryPrimary:   { fontSize: 15, fontWeight: '700' },
  summaryMeta:      { fontSize: 13, color: colors.textMuted },
  notesInput: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    fontSize: 15, color: colors.text, minHeight: 100,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  actionsRow:       { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText:    { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 1, borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  saveBtnText:      { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled:      { opacity: 0.6 },
})

const sjStyles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // ── List
  listContent:       { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
  ctaContainer:      { gap: spacing.sm, marginBottom: spacing.md },
  ctaCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  monthCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  ctaRow:            { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ctaTexts:          { flex: 1 },
  ctaTitle:          { fontSize: 17, fontWeight: '700', color: colors.white },
  ctaSubtitle:       { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  monthBtnText:      { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  chevron:           { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  chevronWhite:      { fontSize: 22, color: colors.white, fontWeight: '300' },
  listHeader: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.md,
    borderRadius: radius.md, marginBottom: spacing.xs, backgroundColor: colors.card,
  },
  dayRowFilled:      { borderLeftWidth: 3, borderLeftColor: colors.success },
  dot:               { width: 10, height: 10, borderRadius: 5 },
  dotFilled:         { backgroundColor: colors.success },
  dotEmpty:          { backgroundColor: colors.border },
  dayInfo:           { flex: 1 },
  dayDate:           { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  dayDateFilled:     { color: colors.text, fontWeight: '600' },
  entryDetails:      { marginTop: 2, gap: 1 },
  entryMeta:         { fontSize: 13, color: colors.textMuted },
  entryMetaStrong:   { fontWeight: '600', color: colors.primary },
  emptyDay:          { fontSize: 13, color: colors.border, fontStyle: 'italic', marginTop: 2 },
  starsRow:          { flexDirection: 'row', gap: 2, marginTop: 2 },
  // ── Month
  monthNav: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  navBtn:            { padding: spacing.xs },
  navBtnDisabled:    { opacity: 0.3 },
  monthTitle: {
    flex: 1, fontSize: 17, fontWeight: '700',
    color: colors.text, textAlign: 'center', textTransform: 'capitalize',
  },
  monthContent:      { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  calendarCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 4,
  },
  calendarHeader:    { flexDirection: 'row', justifyContent: 'space-between' },
  calendarRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700',
    color: colors.textMuted, textTransform: 'uppercase', paddingBottom: spacing.xs,
  },
  calendarCell: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', padding: 2,
  },
  dayDot: {
    width: '85%', aspectRatio: 1, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotToday:       { borderWidth: 2, borderColor: colors.primary },
  dayNum:            { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  dayNumFilled:      { color: colors.white, fontWeight: '700' },
  dayNumFuture:      { color: colors.border },
  nightmareBadge: {
    position: 'absolute', top: 0, right: 0, width: 12, height: 12,
    borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.xs,
  },
  statsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue:         { fontSize: 26, fontWeight: '800', color: colors.primary },
  statLabel:         { fontSize: 13, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  legendCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  legendRow:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot:         { width: 12, height: 12, borderRadius: 6 },
  legendLabel:       { fontSize: 13, color: colors.textMuted },
  // ── Entry
  entryHeaderBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:           { padding: spacing.xs },
  entryContent:      { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  dateHeader: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, gap: 2,
  },
  dateLabel: {
    fontSize: 13, fontWeight: '600', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateValue:         { fontSize: 18, fontWeight: '700', color: colors.text },
  section:           { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  divider:           { height: 1, backgroundColor: colors.border },
  timeFieldGroup:    { gap: spacing.xs },
  fieldLabel:        { fontSize: 14, fontWeight: '600', color: colors.text },
  timeBtn: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  timeValue:         { fontSize: 22, fontWeight: '700', color: colors.primary },
  timeHint:          { fontSize: 13, color: colors.textMuted, marginLeft: spacing.xs },
  confirmBtn: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, alignItems: 'center', marginTop: spacing.xs,
  },
  confirmBtnText:    { color: colors.primary, fontWeight: '600' },
  minutesRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  minutesInput: {
    width: 72, fontSize: 28, fontWeight: '700', color: colors.primary,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  minutesUnit:       { fontSize: 15, color: colors.textMuted },
  minutesConv:       { fontSize: 15, fontWeight: '600', color: colors.primary },
  counterRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  counterBtn: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  counterBtnDisabled:{ opacity: 0.4 },
  counterBtnText:    { fontSize: 24, fontWeight: '300', color: colors.text, lineHeight: 28 },
  counterValue:      { fontSize: 28, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  toggleLeft:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel:       { fontSize: 15, fontWeight: '500', color: colors.text },
  switchTrack: {
    width: 48, height: 28, borderRadius: radius.full,
    backgroundColor: colors.border, padding: 2, justifyContent: 'center',
  },
  switchTrackOn:     { backgroundColor: colors.danger },
  switchThumb: {
    width: 24, height: 24, borderRadius: radius.full,
    backgroundColor: colors.white, alignSelf: 'flex-start',
  },
  switchThumbOn:     { alignSelf: 'flex-end' },
  starsBig:          { flexDirection: 'row', gap: spacing.sm },
  qualityLabel:      { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  notesInput: {
    fontSize: 15, color: colors.text, minHeight: 90, lineHeight: 22,
  },
  seCard: {
    borderWidth: 2, borderRadius: radius.lg, padding: spacing.md,
    backgroundColor: colors.card, gap: spacing.xs,
  },
  seRow:             { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  seTitle:           { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  seScore:           { fontSize: 24, fontWeight: '800' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  saveBtnText:       { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled:       { opacity: 0.6 },
  deleteBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger,
  },
  deleteBtnText:     { fontSize: 15, fontWeight: '600', color: colors.danger },
})
