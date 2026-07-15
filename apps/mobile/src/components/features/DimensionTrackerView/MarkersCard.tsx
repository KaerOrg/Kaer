import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import type { MarkerType, TimelineMarker } from '../../../lib/database'
import { MARKER_TYPES, MARKER_TYPE_COLORS } from '../../../lib/markerTheme'
import { MarkerRow } from './MarkerRow'
import { MarkerFilterChip } from './MarkerFilterChip'

// ─── Carte des repères temporels (Life Chart) — liste typée + filtre ─────────
//
// En-tête (titre + « Ajouter un repère »), filtre optionnel par type, puis la
// liste des repères (leaf `MarkerRow`) : point/icône coloré selon le TYPE
// (identité, pas gravité — MDR), date, libellé, suppression. Partagée entre les
// onglets Suivi et Graphiques.

export interface MarkersCardProps {
  readonly markers: readonly TimelineMarker[]
  readonly title: string
  readonly addLabel: string
  readonly emptyLabel: string
  readonly allLabel: string
  readonly typeLabels: Record<MarkerType, string>
  readonly deleteLabel: string
  readonly locale: string
  readonly accentColor: string
  readonly onAdd: () => void
  readonly onDelete: (id: string) => void
}

export const MarkersCard = React.memo(function MarkersCard({
  markers, title, addLabel, emptyLabel, allLabel, typeLabels, deleteLabel,
  locale, accentColor, onAdd, onDelete,
}: MarkersCardProps) {
  const [filter, setFilter] = useState<MarkerType | null>(null)
  const handleFilter = useCallback((v: MarkerType | null) => setFilter(v), [])

  const shown = useMemo(
    () => (filter == null ? markers : markers.filter(m => m.type === filter)),
    [markers, filter]
  )

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={onAdd}
          style={[styles.addBtn, { borderColor: accentColor }]}
          hitSlop={6}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={14} color={accentColor} />
          <Text style={[styles.addText, { color: accentColor }]}>{addLabel}</Text>
        </Pressable>
      </View>

      {markers.length > 0 ? (
        <View style={styles.filterRow}>
          <MarkerFilterChip value={null} label={allLabel} color={accentColor} selected={filter == null} onSelect={handleFilter} />
          {MARKER_TYPES.map(mt => (
            <MarkerFilterChip
              key={mt}
              value={mt}
              label={typeLabels[mt]}
              color={MARKER_TYPE_COLORS[mt]}
              selected={filter === mt}
              onSelect={handleFilter}
            />
          ))}
        </View>
      ) : null}

      {shown.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <View style={styles.list}>
          {shown.map(marker => (
            <MarkerRow key={marker.id} marker={marker} locale={locale} deleteLabel={deleteLabel} onDelete={onDelete} />
          ))}
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '700', color: colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1,
  },
  addText: { fontSize: 12, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  empty: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  list: { gap: 6 },
})
