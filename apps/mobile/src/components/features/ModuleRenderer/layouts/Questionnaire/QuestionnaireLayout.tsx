// ─── Layout `questionnaire` — échelle clinique interactive (patient) ─────────
//
// Rend une échelle clinique : instructions + légende, avertissement
// hétéro-évaluation optionnel, questions (Likert ou slider à pips), champs
// complémentaires optionnels (nombre / texte), note de bas de page MDR.
// État contrôlé par le parent via `answers` / `onAnswer` (mode interactif
// patient — voir ScaleEntryScreen).
// Conformité MDR 2017/745 : saisie brute uniquement, aucun score ni seuil
// affiché ; le calcul du score est fait ailleurs, pour lecture praticien.

import type { ComponentProps } from 'react'
import { View, Text, Pressable, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { LikertWidget, type LikertOption } from '../../fields/widgets/LikertWidget'
import { styles } from './styles'

export interface QuestionnaireLayoutProps {
  fields: ContentField[]
  answers: (number | null)[]
  onAnswer: (index: number, value: number) => void
  textInputValues?: Record<string, string>
  onTextInput?: (fieldId: string, value: string) => void
  accentColor?: string
}

export function QuestionnaireLayout({ fields, answers, onAnswer, textInputValues, onTextInput, accentColor }: QuestionnaireLayoutProps) {
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
            const icon = (f.props['icon'] as string | undefined) as ComponentProps<typeof MaterialCommunityIcons>['name'] | undefined
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
