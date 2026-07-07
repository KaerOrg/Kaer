import React, { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import type { ActivityRecord } from '../../../../../lib/database'
import { formatDateFull } from '../../../../../lib/dateUtils'
import type { LabelFn } from './types'
import { ActivityListCard } from './ActivityListCard'
import { alStyles } from './styles'

export interface ListViewProps {
  /** Activités passées (date < aujourd'hui), pré-filtrées par le layout. */
  records: ActivityRecord[]
  lbl: LabelFn
  onEdit: (recordId: string) => void
  onToggleDone: (record: ActivityRecord) => void
  onDelete: (record: ActivityRecord) => void
}

// Onglet Historique : les jours passés, plus récents en premier. Les activités
// non réalisées y glissent telles quelles, sans marquage « en retard » (aucune
// culpabilisation, aucune relance conditionnelle aux données : MDR).
export function ListView({ records, lbl, onEdit, onToggleDone, onDelete }: ListViewProps) {
  const groupedDates = useMemo(() => {
    const groups = new Map<string, ActivityRecord[]>()
    for (const r of records) {
      const list = groups.get(r.date)
      if (list) list.push(r)
      else groups.set(r.date, [r])
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [records])

  return (
    <View style={alStyles.container} testID="activity-log-list">
      <ScrollView contentContainerStyle={alStyles.listContent}>
        {records.length === 0 ? (
          <View style={alStyles.empty} testID="list-empty">
            <MaterialCommunityIcons name="history" size={52} color={colors.border} />
            {lbl('history_empty_text') ? (
              <Text style={alStyles.emptyText}>{lbl('history_empty_text')}</Text>
            ) : null}
          </View>
        ) : (
          groupedDates.map(([date, dayRecords]) => (
            <View key={date} style={alStyles.dayList}>
              <Text style={alStyles.dayListTitle}>{formatDateFull(date)}</Text>
              {dayRecords.map(r => (
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
          ))
        )}
      </ScrollView>
    </View>
  )
}
