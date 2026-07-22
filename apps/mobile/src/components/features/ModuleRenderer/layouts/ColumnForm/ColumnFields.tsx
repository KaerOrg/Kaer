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
import type { FormValue } from '../../../../../lib/database'
import { ColumnTimeField } from './ColumnTimeField'
import { ColumnChoiceField } from './ColumnChoiceField'
import { ColumnChipsField } from './ColumnChipsField'
import { hasToken, toggleToken } from './textSuggestions'
import { styles } from './styles'

export interface ColumnFieldsProps {
  /** Champs enfants de la colonne (déjà résolus par le layout). */
  fields: ContentField[]
  /** Valeurs courantes du formulaire. */
  values: Record<string, FormValue>
  /** Module courant — persistance des chips personnelles (`column_chips_field`). */
  moduleId: string
  /** Couleur d'accent de la colonne. */
  accent: string
  t: (key: string) => string
  /** Écriture d'une valeur (clé `form_entries` → valeur). */
  onChangeValue: (key: string, value: FormValue) => void
  /**
   * Teinte la bordure des champs texte à la couleur d'accent de la colonne.
   * Activé uniquement en mode wizard (refonte 1B) : une seule colonne à l'écran,
   * la bordure accentuée renforce le rattachement du champ à l'étape. En mode
   * scroll, le liseré gauche de la carte de section porte déjà l'accent.
   */
  accentInputBorder?: boolean
}

export const ColumnFields = memo(function ColumnFields({
  fields, values, moduleId, accent, t, onChangeValue, accentInputBorder = false,
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
                style={[
                  styles.textInput,
                  multiline && minHeight > 0 && { minHeight },
                  accentInputBorder && { borderColor: accent },
                ]}
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

        if (child.field_type === 'column_choice_field') {
          const codes = collectIndexed(child.props, 'option_code')
          const labelCodes = collectIndexed(child.props, 'option_label')
          const options = codes.map((code, i) => ({ code, label: t(labelCodes[i] ?? code) }))
          const variant = child.props['variant'] === 'radio' ? 'radio' : 'pills'
          const current = typeof values[key] === 'string' ? (values[key] as string) : ''
          return (
            <ColumnChoiceField
              key={child.id}
              fieldKey={key}
              label={labelOrPlaceholder}
              options={options}
              variant={variant}
              value={current}
              accent={child.props['accent_color'] ?? accent}
              onChange={(code) => onChangeValue(key, code)}
            />
          )
        }

        if (child.field_type === 'column_chips_field') {
          const codes = collectIndexed(child.props, 'option_code')
          const labelCodes = collectIndexed(child.props, 'option_label')
          const options = codes.map((code, i) => ({ code, label: t(labelCodes[i] ?? code) }))
          const current = Array.isArray(values[key]) ? (values[key] as string[]) : []
          return (
            <ColumnChipsField
              key={child.id}
              fieldKey={key}
              moduleId={moduleId}
              groupKey={child.props['group_key'] ?? key}
              label={labelOrPlaceholder}
              options={options}
              allowCustom={child.props['allow_custom'] === '1'}
              accent={child.props['accent_color'] ?? accent}
              value={current}
              addLabel={t('common.add_custom_chip')}
              onChange={(next) => onChangeValue(key, next)}
            />
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
