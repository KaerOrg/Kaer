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
  records: ActivityRecord[]
  lbl: LabelFn
  onEdit: (recordId: string) => void
  onToggleDone: (record: ActivityRecord) => void
  onDelete: (record: ActivityRecord) => void
}

// Historique complet : activités groupées par date métier, plus récentes en premier.
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
            <MaterialCommunityIcons name="run-fast" size={52} color={colors.border} />
            {lbl('empty_title') ? (
              <Text style={alStyles.emptyTitle}>{lbl('empty_title')}</Text>
            ) : null}
            {lbl('empty_text') ? (
              <Text style={alStyles.emptyText}>{lbl('empty_text')}</Text>
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
                  onToggleDone={() => onToggleDone(r)}
                  onEdit={() => onEdit(r.id)}
                  onDelete={() => onDelete(r)}
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
