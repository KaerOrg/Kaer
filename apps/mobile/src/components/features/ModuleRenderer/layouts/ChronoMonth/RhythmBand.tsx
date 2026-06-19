import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing } from '../../../../../theme'
import { timeToFraction, type AnchorEntry, type AnchorSpec } from './chronoMonthUtils'

interface Props {
  entriesByDate: ReadonlyMap<string, AnchorEntry>
  anchors: readonly AnchorSpec[]
}

const AXIS = ['0h', '6h', '12h', '18h', '24h'] as const
const GRID = [0.25, 0.5, 0.75] as const

// Bande de rythme = un « strip plot » par repère. Chaque ligne = un repère ;
// chaque point = un jour saisi, positionné selon l'heure (axe 0-24h). Points
// groupés ⇒ rythme régulier ; dispersés ⇒ irrégulier. Lisible d'un coup d'œil.
// MDR : horaires bruts uniquement, aucune analyse ni couleur d'alerte.
export function RhythmBand({ entriesByDate, anchors }: Props) {
  const { t } = useTranslation()

  const rows = useMemo(() => {
    return anchors.map(a => {
      const fractions: number[] = []
      for (const entry of entriesByDate.values()) {
        const v = entry.anchors[a.key]
        if (v) fractions.push(timeToFraction(v))
      }
      return { key: a.key, color: a.color, label: t(a.labelCode), fractions }
    })
  }, [entriesByDate, anchors, t])

  return (
    <View style={styles.wrapper} testID="chrono-rhythm-band">
      {rows.map(row => (
        <View key={row.key} style={styles.row}>
          <View style={styles.labelCell}>
            <View style={[styles.labelDot, { backgroundColor: row.color }]} />
            <Text style={styles.labelText} numberOfLines={1}>{row.label}</Text>
          </View>
          <View style={styles.track}>
            {GRID.map(f => (
              <View key={f} style={[styles.gridLine, { left: `${f * 100}%` }]} />
            ))}
            {row.fractions.map((f, i) => (
              <View
                key={i}
                style={[styles.dot, { left: `${f * 100}%`, backgroundColor: row.color }]}
              />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.axisRow}>
        <View style={styles.labelCell} />
        <View style={styles.axisTrack}>
          {AXIS.map(label => (
            <Text key={label} style={styles.axisLabel}>{label}</Text>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: spacing.lg, marginTop: spacing.xs, gap: 7 },
  row: { flexDirection: 'row', alignItems: 'center' },
  labelCell: { width: 100, flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 6 },
  labelDot: { width: 8, height: 8, borderRadius: 4 },
  labelText: { fontSize: 11, color: colors.text, flex: 1 },
  track: {
    flex: 1,
    height: 16,
    backgroundColor: colors.background,
    borderRadius: 999,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dot: {
    position: 'absolute',
    top: '50%',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: -4.5,
    marginLeft: -4.5,
    opacity: 0.6,
  },
  axisRow: { flexDirection: 'row', marginTop: 2 },
  axisTrack: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
})
