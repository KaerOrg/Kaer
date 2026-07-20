import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { RatingSelector } from '@ui/RatingSelector'
import { etStyles } from './styles'

export interface SudsFieldSkip {
  /** Texte du bouton quand une valeur est présente (« remplir plus tard »). */
  label: string
  /** Texte quand la valeur est déjà nulle (« non renseigné »). */
  activeLabel: string
}

export interface SudsFieldProps {
  label: string
  hint?: string
  value: number | null
  max: number
  color: string
  sudsSteps: number[]
  onChange: (v: number | null) => void
  /** Si fourni, propose de laisser la valeur vide (mesure optionnelle). */
  skip?: SudsFieldSkip
  /** Légende affichée sous les pastilles (ex. « 0 = aucun stress… »). */
  legend?: string
  testID?: string
}

/** Carte de saisie d'un SUDS (0–max) — affichage brut, sans label de gravité. */
export function SudsField({ label, hint, value, max, color, sudsSteps, onChange, skip, legend, testID }: SudsFieldProps) {
  return (
    <View style={etStyles.card} testID={testID}>
      <View style={etStyles.sudsHeader}>
        <View style={etStyles.sudsHeaderLeft}>
          <Text style={etStyles.sudsHeaderLabel}>{label}</Text>
          {hint ? <Text style={etStyles.sudsHeaderHint}>{hint}</Text> : null}
        </View>
        <View style={etStyles.sudsValueBox}>
          {value === null ? (
            <Text style={etStyles.sudsValueNull}>-</Text>
          ) : (
            <Text style={[etStyles.sudsValueBig, { color }]}>{value}</Text>
          )}
          <Text style={etStyles.sudsValueMax}>{`/${max}`}</Text>
        </View>
      </View>
      <RatingSelector
        value={value}
        steps={sudsSteps}
        color={color}
        label={label}
        variant="numbered"
        showHeader={false}
        onPress={onChange}
      />
      {legend ? <Text style={etStyles.sudsLegend}>{legend}</Text> : null}
      {skip ? (
        <Pressable
          style={etStyles.skipBtn}
          onPress={() => onChange(null)}
          accessibilityRole="button"
          accessibilityLabel={skip.label}
          testID={testID ? `${testID}-skip` : undefined}
        >
          <Text style={[etStyles.skipText, value === null && { color, fontWeight: '700' }]}>
            {value === null ? skip.activeLabel : skip.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}
