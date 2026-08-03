import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { colors, spacing, radius, fontSize } from '@theme'
import { frequencyLabel, isShifted, type ReminderDraft } from './reminderDraft'

// Une carte de rappel : l'heure en grand, ce qu'elle vaut en clair à côté, et
// l'interrupteur de pause. Dépliée, elle donne les sept jours et la suppression.
//
// L'heure est le contrôle principal parce que c'est ce que le patient vient changer.
// Rien n'y est conditionnel à une saisie : un rappel est un horaire (MDR).

export interface ReminderCardProps {
  readonly draft: ReminderDraft
  readonly expanded: boolean
  readonly onToggleExpanded: (key: string) => void
  readonly onPressTime: (key: string) => void
  readonly onToggleDay: (key: string, day: number) => void
  readonly onTogglePaused: (key: string) => void
  readonly onDelete: (key: string) => void
  readonly texts: {
    readonly tapToChange: string
    readonly everyDay: string
    readonly paused: string
    readonly shifted: string
    readonly deleteBtn: string
    readonly dayLabels: readonly string[]
    readonly daysA11y: string
    readonly pauseA11y: string
  }
}

export function ReminderCard({
  draft, expanded, onToggleExpanded, onPressTime, onToggleDay,
  onTogglePaused, onDelete, texts,
}: ReminderCardProps) {
  const handleExpand = useCallback(() => onToggleExpanded(draft.key), [onToggleExpanded, draft.key])
  const handleTime = useCallback(() => onPressTime(draft.key), [onPressTime, draft.key])
  const handlePause = useCallback(() => onTogglePaused(draft.key), [onTogglePaused, draft.key])
  const handleDelete = useCallback(() => onDelete(draft.key), [onDelete, draft.key])

  const meta = draft.paused
    ? texts.paused
    : expanded
      ? texts.tapToChange
      : frequencyLabel(draft, texts.everyDay, texts.dayLabels)

  return (
    <Card
      variant="outlined"
      style={expanded ? styles.cardOpen : undefined}
      testID={`reminder-card-${draft.key}`}
    >
      <Pressable
        style={styles.head}
        onPress={handleExpand}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={draft.time}
      >
        <Pressable
          onPress={handleTime}
          style={[styles.timeBox, draft.paused && styles.timeBoxPaused]}
          accessibilityRole="button"
          accessibilityLabel={`${texts.tapToChange} ${draft.time}`}
          testID={`reminder-time-${draft.key}`}
        >
          <Text style={[styles.time, draft.paused && styles.timePaused]}>{draft.time}</Text>
        </Pressable>

        <View style={styles.metaWrap}>
          <Text style={styles.meta} numberOfLines={2}>{meta}</Text>
          {isShifted(draft) ? <Text style={styles.shifted}>{texts.shifted}</Text> : null}
        </View>

        <Switch
          value={!draft.paused}
          onValueChange={handlePause}
          trackColor={{ true: colors.primary, false: colors.border }}
          accessibilityLabel={texts.pauseA11y}
          testID={`reminder-switch-${draft.key}`}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.days} accessibilityLabel={texts.daysA11y}>
            {texts.dayLabels.map((label, index) => {
              const day = index + 1
              const on = draft.days.includes(day)
              return (
                <DayDot
                  key={day}
                  day={day}
                  label={label}
                  selected={on}
                  onPress={onToggleDay}
                  cardKey={draft.key}
                />
              )
            })}
          </View>

          <Button
            variant="ghostDanger"
            size="sm"
            label={texts.deleteBtn}
            onPress={handleDelete}
            testID={`reminder-delete-${draft.key}`}
          />
        </View>
      ) : null}
    </Card>
  )
}

/** Une pastille de jour. Composant dédié : callback stable par jour. */
function DayDot({ day, label, selected, onPress, cardKey }: {
  day: number
  label: string
  selected: boolean
  onPress: (key: string, day: number) => void
  cardKey: string
}) {
  const handlePress = useCallback(() => onPress(cardKey, day), [onPress, cardKey, day])
  return (
    <Pressable
      onPress={handlePress}
      style={[styles.dot, selected && styles.dotOn]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      testID={`reminder-day-${cardKey}-${day}`}
    >
      <Text style={[styles.dotLabel, selected && styles.dotLabelOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cardOpen: { borderColor: colors.primary },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '14',
  },
  timeBoxPaused: { backgroundColor: 'transparent' },
  time: {
    fontSize: fontSize.h3,
    fontWeight: '700',
    color: colors.text,
  },
  timePaused: { color: colors.textMuted },
  metaWrap: { flex: 1, flexShrink: 1 },
  meta: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  shifted: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  body: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotLabel: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dotLabelOn: { color: colors.white },
})
