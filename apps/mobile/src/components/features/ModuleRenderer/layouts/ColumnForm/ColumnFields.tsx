// ─── ColumnFields — rendu du corps d'une colonne (texte / slider / horaire) ──
//
// Extrait de ColumnFormLayout pour être partagé par les deux modes de saisie :
// le scroll classique (toutes les colonnes empilées) et le wizard (une colonne
// par étape). Ne rend QUE les champs enfants d'une colonne, pas son chrome
// (badge, titre, question) — celui-ci est propre à chaque mode.
//
// Conformité MDR 2017/745 : les curseurs ne sont jamais pré-positionnés
// (`value = null` tant que le patient n'a pas glissé) — aucune valeur d'ancrage.

import { memo, Fragment } from 'react'
import { View, TextInput } from 'react-native'
import { colors } from '@theme'
import { collectIndexed, readSliderParams } from '@kaer/shared'
import { Slider } from '@ui/Slider'
import { Chip } from '@ui/Chip'
import type { ContentField } from '@services/moduleService'
import { ColumnTimeField } from './ColumnTimeField'
import { hasToken, toggleToken } from './textSuggestions'
import { styles } from './styles'

export interface ColumnFieldsProps {
  /** Champs enfants de la colonne (déjà résolus par le layout). */
  fields: ContentField[]
  /** Valeurs courantes du formulaire. */
  values: Record<string, string | number>
  /** Couleur d'accent de la colonne. */
  accent: string
  t: (key: string) => string
  /** Écriture d'une valeur (clé `form_entries` → valeur). */
  onChangeValue: (key: string, value: string | number) => void
}

export const ColumnFields = memo(function ColumnFields({
  fields, values, accent, t, onChangeValue,
}: ColumnFieldsProps) {
  return (
    <>
      {fields.map(child => {
        const key = child.props['key']
        if (!key) return null
        const labelOrPlaceholder = child.text_code ? t(child.text_code) : ''

        if (child.field_type === 'column_text_field') {
          const multiline = (child.props['multiline'] ?? '1') !== '0'
          const minHeight = parseInt(child.props['min_height'] ?? (multiline ? '72' : '0'), 10)
          const value = String(values[key] ?? '')
          // Chips d'aide au vocabulaire (suggestion_1..n) : ajoutent / retirent
          // leur mot dans le champ — le texte libre reste roi.
          const suggestionCodes = collectIndexed(child.props, 'suggestion')
          return (
            <Fragment key={child.id}>
              <TextInput
                style={[styles.textInput, multiline && minHeight > 0 && { minHeight }]}
                placeholder={labelOrPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={(v) => onChangeValue(key, v)}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                testID={`field-${key}`}
              />
              {suggestionCodes.length > 0 ? (
                <View style={styles.suggestions} testID={`suggestions-${key}`}>
                  {suggestionCodes.map(code => {
                    const suggestion = t(code)
                    return (
                      <Chip
                        key={code}
                        label={suggestion}
                        size="sm"
                        color={accent}
                        selected={hasToken(value, suggestion)}
                        onPress={() => onChangeValue(key, toggleToken(value, suggestion))}
                        testID={`suggestion-${key}-${code}`}
                      />
                    )
                  })}
                </View>
              ) : null}
            </Fragment>
          )
        }

        if (child.field_type === 'column_slider_field') {
          const { min, max, step } = readSliderParams(child)
          const sliderColor = child.props['color'] ?? accent
          // null = curseur non touché : rien n'est saisi tant que le patient n'a
          // pas glissé le curseur (pas de valeur d'ancrage — MDR 2017/745).
          const numValue = typeof values[key] === 'number' ? (values[key] as number) : null
          return (
            <View key={child.id} testID={`slider-${key}`}>
              <Slider
                label={labelOrPlaceholder}
                value={numValue}
                min={min}
                max={max}
                step={step}
                unit={child.props['unit']}
                color={sliderColor}
                showEndLabels
                testID={`slider-input-${key}`}
                onChange={(v) => onChangeValue(key, v)}
              />
            </View>
          )
        }

        if (child.field_type === 'column_time_field') {
          const optional = (child.props['optional'] ?? '1') !== '0'
          const timeValue = typeof values[key] === 'string' ? (values[key] as string) : ''
          return (
            <ColumnTimeField
              key={child.id}
              fieldKey={key}
              label={labelOrPlaceholder}
              value={timeValue}
              optional={optional}
              accent={accent}
              onChange={(next) => onChangeValue(key, next)}
            />
          )
        }
        return null
      })}
    </>
  )
})
