import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { mondayOf, shiftDate, weekDays, todayIso } from '@kaer/shared'
import type { ActivityRecord } from '../../../../../lib/database'
import type { LabelFn } from './types'
import { ActivityListCard } from './ActivityListCard'
import { alStyles } from './styles'

export interface WeekViewProps {
  records: ActivityRecord[]
  lbl: LabelFn
  locale: string
  onEdit: (recordId: string) => void
  onToggleDone: (record: ActivityRecord) => void
  onDelete: (record: ActivityRecord) => void
}

// Vue semaine (unité de planification de l'activation comportementale) :
// 7 jours, aujourd'hui mis en évidence, navigation semaine précédente/suivante.
// La rétrospection longue vit côté praticien (panneau web) — ici, la semaine.
export function WeekView({ records, lbl, locale, onEdit, onToggleDone, onDelete }: WeekViewProps) {
  const [monday, setMonday] = useState(() => mondayOf(todayIso()))

  const goPrevWeek = useCallback(() => setMonday(m => shiftDate(m, -7)), [])
  const goNextWeek = useCallback(() => setMonday(m => shiftDate(m, 7)), [])

  const days = useMemo(() => weekDays(monday), [monday])
  const byDate = useMemo(() => {
    const map = new Map<string, ActivityRecord[]>()
    for (const r of records) {
      const list = map.get(r.date)
      if (list) list.push(r)
      else map.set(r.date, [r])
    }
    return map
  }, [records])

  const today = todayIso()
  const weekIsEmpty = days.every(d => (byDate.get(d) ?? []).length === 0)

  const rangeLabel = useMemo(() => {
    const fmt = (iso: string) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    return `${fmt(days[0])} - ${fmt(days[6])}`
  }, [days, locale])

  return (
    <View style={alStyles.container} testID="activity-log-week">
      <View style={alStyles.weekNav}>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />}
          accessibilityLabel={lbl('week_prev_label')}
          onPress={goPrevWeek}
          testID="week-prev"
        />
        <Text style={alStyles.weekTitle}>{rangeLabel}</Text>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<MaterialCommunityIcons name="chevron-right" size={26} color={colors.primary} />}
          accessibilityLabel={lbl('week_next_label')}
          onPress={goNextWeek}
          testID="week-next"
        />
      </View>

      <ScrollView contentContainerStyle={alStyles.listContent}>
        {weekIsEmpty ? (
          <View style={alStyles.empty} testID="week-empty">
            <MaterialCommunityIcons name="calendar-plus" size={52} color={colors.border} />
            {lbl('week_empty_text') ? (
              <Text style={alStyles.emptyText}>{lbl('week_empty_text')}</Text>
            ) : null}
          </View>
        ) : (
          days.map(day => {
            const dayRecords = byDate.get(day) ?? []
            const isToday = day === today
            return (
              <View key={day} style={alStyles.dayList} testID={`week-day-${day}`}>
                <Text style={[alStyles.dayListTitle, isToday && alStyles.dayListTitleToday]}>
                  {new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
                {dayRecords.map(r => (
                  <ActivityListCard
                    key={r.id}
                    record={r}
                    onToggleDone={() => onToggleDone(r)}
                    onEdit={() => onEdit(r.id)}
                    onDelete={() => onDelete(r)}
                    lbl={lbl}
                  />
                ))}
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
