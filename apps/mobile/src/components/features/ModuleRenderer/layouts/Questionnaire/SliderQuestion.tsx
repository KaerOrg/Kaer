import React, { useCallback, type ComponentProps } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Slider } from '@ui/Slider'
import type { ContentField } from '@services/moduleService'
import { styles } from './styles'

// ─── Question à curseur d'une échelle (scale_slider_question) ────────────────
//
// Rend une dimension sur curseur continu (primitive `ui/Slider`) : en-tête
// (icône + libellé + valeur en grand, teinte « ink » de la dimension), piste
// remplie dans la teinte « fill », et ancres textuelles bas / « Normal » / haut.
//
// `value = null` → piste vide, aucun thumb : rien n'est pré-sélectionné tant que
// le patient n'a pas glissé le curseur (pas de valeur d'ancrage — MDR 2017/745).
// Le compteur {answered}/N du parent ne compte donc que les dimensions touchées.
//
// Composant dédié (et non rendu inline dans QuestionnaireLayout) pour exposer un
// `onChange` STABLE au `Slider` mémoïsé (zéro re-render parasite).

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

export interface SliderQuestionProps {
  readonly field: ContentField
  readonly index: number
  readonly value: number | null
  readonly onAnswer: (index: number, value: number) => void
  readonly t: (key: string) => string
}

export const SliderQuestion = React.memo(function SliderQuestion({
  field, index, value, onAnswer, t,
}: SliderQuestionProps) {
  const min = parseInt(field.props['min'] ?? '1', 10)
  const max = parseInt(field.props['max'] ?? '10', 10)
  const fill = field.props['color'] ?? colors.primary
  const ink = field.props['ink_color'] ?? fill
  const icon = field.props['icon'] as IconName | undefined
  const lowHintCode = field.props['low_hint_code']
  const midHintCode = field.props['mid_hint_code']
  const highHintCode = field.props['high_hint_code']
  const label = t(field.text_code ?? '')

  const handleChange = useCallback(
    (v: number) => onAnswer(index, v),
    [onAnswer, index]
  )

  return (
    <View style={styles.sliderCard}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderLabelRow}>
          {icon != null ? <MaterialCommunityIcons name={icon} size={18} color={ink} /> : null}
          <Text style={[styles.sliderLabel, { color: ink }]}>{label}</Text>
        </View>
        {value !== null ? (
          <Text style={[styles.sliderValue, { color: ink }]}>{value}</Text>
        ) : null}
      </View>

      <Slider
        value={value}
        min={min}
        max={max}
        color={fill}
        label={label}
        showHeader={false}
        onChange={handleChange}
        testID={`slider-${field.id}`}
      />

      {(lowHintCode != null || midHintCode != null || highHintCode != null) ? (
        <View style={styles.sliderHints}>
          <Text style={styles.sliderHint}>{lowHintCode != null ? t(lowHintCode) : ''}</Text>
          {midHintCode != null ? (
            <Text style={[styles.sliderHint, styles.sliderHintMid, { color: ink }]}>{t(midHintCode)}</Text>
          ) : null}
          <Text style={styles.sliderHint}>{highHintCode != null ? t(highHintCode) : ''}</Text>
        </View>
      ) : null}
    </View>
  )
})
