import React, { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { todayIso } from '@kaer/shared'
import type { ActivityRecord } from '../../../../../lib/database'
import type { LabelFn } from './types'
import { ActivityListCard } from './ActivityListCard'
import { alStyles } from './styles'

export interface AgendaViewProps {
  /** Activités du jour et à venir (date >= aujourd'hui), pré-filtrées par le layout. */
  records: ActivityRecord[]
  lbl: LabelFn
  locale: string
  onEdit: (recordId: string) => void
  onToggleDone: (record: ActivityRecord) => void
  onDelete: (record: ActivityRecord) => void
}

function formatDay(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// Vue principale : « Aujourd'hui » toujours en tête (même vide, invitation
// implicite), puis les jours à venir qui ont des activités, ordre croissant.
// Le passé vit dans l'onglet Historique : la page de vie reste propre.
export function AgendaView({ records, lbl, locale, onEdit, onToggleDone, onDelete }: AgendaViewProps) {
  const today = todayIso()

  const { todayRecords, upcomingDays } = useMemo(() => {
    const byDate = new Map<string, ActivityRecord[]>()
    for (const r of records) {
      const list = byDate.get(r.date)
      if (list) list.push(r)
      else byDate.set(r.date, [r])
    }
    const futureDays = [...byDate.keys()].filter(d => d > today).sort()
    return {
      todayRecords: byDate.get(today) ?? [],
      upcomingDays: futureDays.map(d => ({ date: d, items: byDate.get(d) as ActivityRecord[] })),
    }
  }, [records, today])

  return (
    <View style={alStyles.container} testID="activity-log-agenda">
      <ScrollView contentContainerStyle={alStyles.listContent}>
        {/* Aujourd'hui : toujours affiché */}
        <View style={alStyles.dayList} testID="agenda-today">
          <Text style={[alStyles.dayListTitle, alStyles.dayListTitleToday]}>
            {formatDay(today, locale)}
          </Text>
          {todayRecords.length === 0 ? (
            <Text style={alStyles.todayEmptyText} testID="agenda-today-empty">
              {lbl('today_empty_text')}
            </Text>
          ) : (
            todayRecords.map(r => (
              <ActivityListCard
                key={r.id}
                record={r}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
                onDelete={onDelete}
                lbl={lbl}
              />
            ))
          )}
        </View>

        {/* À venir : uniquement les jours qui portent des activités */}
        {upcomingDays.map(day => (
          <View key={day.date} style={alStyles.dayList} testID={`agenda-day-${day.date}`}>
            <Text style={alStyles.dayListTitle}>{formatDay(day.date, locale)}</Text>
            {day.items.map(r => (
              <ActivityListCard
                key={r.id}
                record={r}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
                onDelete={onDelete}
                lbl={lbl}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
