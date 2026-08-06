import { memo } from 'react'
import { View, Text } from 'react-native'
import type { WeekPracticeDay } from '@kaer/shared'
import { hubStyles } from './hubStyles'

export interface WeekDotsProps {
  /** Les 7 jours de la semaine courante, du lundi au dimanche. */
  days: readonly WeekPracticeDay[]
  /** Initiales des jours, dans le même ordre (lundi → dimanche). */
  dayLabels: readonly string[]
  /** Couleur de remplissage d'un jour pratiqué. */
  color: string
  /** Résumé lu par les lecteurs d'écran (« 3 jours pratiqués cette semaine »). */
  accessibilityLabel: string
}

/**
 * Les sept jours de la semaine : plein si au moins une session ce jour-là, bordure
 * pointillée pour aujourd'hui. Restitution brute : aucune couleur de valence, aucun
 * jugement sur un jour vide (MDR 2017/745).
 *
 * La rangée est lue comme **un seul élément** : égrener sept initiales et leur état
 * serait illisible au lecteur d'écran, là où le résumé dit la même chose en une
 * phrase.
 */
export const WeekDots = memo(function WeekDots({ days, dayLabels, color, accessibilityLabel }: WeekDotsProps) {
  return (
    <View
      style={hubStyles.weekDots}
      accessible
      accessibilityLabel={accessibilityLabel}
      testID="breathing-week-dots"
    >
      {days.map((day, index) => (
        <View
          key={day.iso}
          style={[
            hubStyles.weekDot,
            day.practiced ? { backgroundColor: color } : null,
            day.isToday ? hubStyles.weekDotToday : null,
          ]}
          testID={`breathing-week-dot-${day.iso}`}
        >
          <Text style={[hubStyles.weekDotLabel, day.practiced ? hubStyles.weekDotLabelPracticed : null]}>
            {dayLabels[index]}
          </Text>
        </View>
      ))}
    </View>
  )
})
