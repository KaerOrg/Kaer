import React, { useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, radius, spacing } from '@theme'

export interface WeekDay {
  /** Date ISO locale (YYYY-MM-DD) — identifiant de la cellule. */
  iso: string
  /** Abréviation du jour (ex. « LUN »), déjà localisée par l'appelant. */
  weekday: string
  /** Numéro du jour dans le mois (ex. « 16 »). */
  dayNumber: string
  /** Jour actuellement sélectionné : pastille pleine turquoise foncé, texte blanc. */
  selected: boolean
  /** Au moins un rendez-vous à venir ce jour → point d'événement sous le numéro. */
  hasEvent: boolean
}

interface WeekStripProps {
  days: WeekDay[]
  onSelectDay: (iso: string) => void
}

/**
 * Bande semaine de l'agenda patient : une rangée fluide de jours tappables. Le jour
 * sélectionné est une pastille pleine `primaryDark` (blanc sur turquoise foncé pour
 * l'AA) ; un point `primary` sous les jours porteurs d'un RDV. Purement de la
 * navigation temporelle — n'interprète ni ne conclut rien (MDR 2017/745).
 */
export const WeekStrip = React.memo(function WeekStrip({ days, onSelectDay }: WeekStripProps) {
  return (
    <View style={styles.row}>
      {days.map((day) => (
        <DayCell key={day.iso} day={day} onSelect={onSelectDay} />
      ))}
    </View>
  )
})

// Cellule de jour sélectionnable : c'est une SURFACE de sélecteur temporel (cellule de
// calendrier), pas un bouton d'action — `ui/Button` ne s'y applique pas. `Pressable` nu
// justifié, avec `accessibilityRole="button"` + état `selected`.
const DayCell = React.memo(function DayCell({
  day,
  onSelect,
}: {
  day: WeekDay
  onSelect: (iso: string) => void
}) {
  const handlePress = useCallback(() => onSelect(day.iso), [onSelect, day.iso])
  return (
    <Pressable
      style={styles.cell}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: day.selected }}
      accessibilityLabel={`${day.weekday} ${day.dayNumber}`}
    >
      <View style={[styles.pill, day.selected ? styles.pillSelected : null]}>
        <Text style={[styles.weekday, day.selected ? styles.weekdaySelected : null]}>
          {day.weekday}
        </Text>
        <Text style={[styles.dayNumber, day.selected ? styles.dayNumberSelected : null]}>
          {day.dayNumber}
        </Text>
      </View>
      <View style={styles.dotSlot}>
        {day.hasEvent && !day.selected ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  // Rangée fluide : chaque jour prend une part égale, aucune largeur figée → jamais
  // de débordement latéral quelle que soit la taille d'écran.
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    // Cible tactile ≥ 44px de haut, incluse dans la pastille sélectionnée.
    minWidth: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  pillSelected: { backgroundColor: colors.primaryDark },
  weekday: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  weekdaySelected: { color: colors.primaryPale },
  dayNumber: { fontSize: 18, fontWeight: '600', color: colors.text },
  dayNumberSelected: { color: colors.white },
  // Hauteur réservée en permanence pour que la présence/absence du point ne décale
  // pas verticalement les cellules voisines.
  dotSlot: { height: 10, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.primary },
})
