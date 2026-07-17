import React, { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import type { TimelineMarker } from '../../../lib/database'
import { MARKER_TYPE_COLORS, MARKER_TYPE_ICONS } from '../../../lib/markerTheme'

// Ligne d'un repère dans la liste — leaf mémoïsé à callback stable (item de liste).

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

export interface MarkerRowProps {
  readonly marker: TimelineMarker
  readonly locale: string
  readonly deleteLabel: string
  readonly onDelete: (id: string) => void
}

export const MarkerRow = React.memo(function MarkerRow({ marker, locale, deleteLabel, onDelete }: MarkerRowProps) {
  const handleDelete = useCallback(() => onDelete(marker.id), [onDelete, marker.id])
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons
        name={MARKER_TYPE_ICONS[marker.type] as IconName}
        size={16}
        color={MARKER_TYPE_COLORS[marker.type]}
      />
      <Text style={styles.date}>
        {new Date(marker.date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
      </Text>
      <Text style={styles.label} numberOfLines={1}>{marker.label}</Text>
      <Button
        variant="ghost"
        onPress={handleDelete}
        accessibilityLabel={deleteLabel}
        iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 12, fontWeight: '700', color: colors.textMuted, minWidth: 52 },
  label: { fontSize: 13, color: colors.text, flex: 1 },
})
