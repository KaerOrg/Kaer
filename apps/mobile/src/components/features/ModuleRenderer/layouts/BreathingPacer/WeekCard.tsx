import { memo } from 'react'
import { View, Text } from 'react-native'
import { Card } from '@ui/Card'
import { Button } from '@ui/Button'
import { ProgressBar } from '@ui/ProgressBar'
import type { WeekPracticeDay } from '@kaer/shared'
import { WeekDots } from './WeekDots'
import { ReminderRow } from './ReminderRow'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

/** Ce que la ligne de rappel a besoin de savoir, en un seul objet. */
export interface ReminderLine {
  summary: string
  actionLabel: string
  onPress: () => void
}

export interface WeekCardProps {
  days: readonly WeekPracticeDay[]
  dayLabels: readonly string[]
  /** Jours consécutifs portant au moins une session. */
  streak: number
  /** Sessions enregistrées cette semaine. */
  done: number
  /** Objectif hebdomadaire, en sessions. */
  goal: number
  color: string
  lbl: LabelFn
  onAdjustGoal: () => void
  reminder: ReminderLine
}

/**
 * Carte « Cette semaine » : les sept jours, la série en cours, l'avancement vers
 * l'objectif, et la ligne de rappel.
 *
 * Tous les chiffres sont des **comptes bruts** (MDR 2017/745) : aucun message de
 * félicitation, aucun jugement calculé, aucune couleur qui varierait selon la
 * valeur. La barre porte la couleur de la technique, quel que soit l'avancement.
 */
export const WeekCard = memo(function WeekCard({
  days, dayLabels, streak, done, goal, color, lbl, onAdjustGoal, reminder,
}: WeekCardProps) {
  const practicedDays = days.filter(day => day.practiced).length

  return (
    <Card variant="elevated" testID="breathing-week-card">
      <View style={hubStyles.weekHeader}>
        <Text style={hubStyles.weekTitle}>{lbl('hub_week_title')}</Text>
        <Button
          variant="ghost"
          size="sm"
          label={lbl('hub_adjust_goal')}
          onPress={onAdjustGoal}
          accessibilityLabel={lbl('hub_adjust_goal')}
          testID="breathing-adjust-goal"
        />
      </View>

      <WeekDots
        days={days}
        dayLabels={dayLabels}
        color={color}
        accessibilityLabel={lbl('hub_week_days_a11y', { count: practicedDays })}
      />

      <View style={hubStyles.weekCounts}>
        <Text style={hubStyles.weekStreak}>{lbl('hub_streak', { count: streak })}</Text>
        <Text style={hubStyles.weekGoal}>{lbl('hub_week_progress', { done, goal })}</Text>
      </View>
      <ProgressBar
        value={done}
        max={goal}
        color={color}
        accessibilityLabel={lbl('hub_week_progress', { done, goal })}
        testID="breathing-week-progress"
      />

      <View style={hubStyles.divider} />
      <ReminderRow {...reminder} />
    </Card>
  )
})
