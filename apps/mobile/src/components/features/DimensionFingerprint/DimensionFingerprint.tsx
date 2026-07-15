import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

// ─── Empreinte multi-dimensions — mini-graphe à barres verticales ────────────
//
// Remplace l'affichage d'une moyenne « X/10 » (score global trompeur, supprimé
// par l'épique #162) : on lit N symptômes bruts, jamais un agrégat. Chaque barre
// = une dimension, hauteur proportionnelle à la valeur, valeur affichée au-dessus,
// libellé court en dessous, teinte = identité de la dimension.
//
// Conformité MDR 2017/745 : la couleur n'encode QUE l'identité de la dimension,
// la hauteur QUE la magnitude brute. Aucun seuil, aucun rouge/vert, aucune moyenne.
//
// Largeur fluide (chaque barre `flex: 1`) — jamais de scroll horizontal.

export interface FingerprintBar {
  readonly key: string
  /** Libellé court sous la barre (ex. « Hum », « Éne »). */
  readonly label: string
  /** Valeur brute, ou null si la dimension n'a pas été renseignée. */
  readonly value: number | null
  /** Teinte pastel de la dimension (fill). */
  readonly color: string
}

export interface DimensionFingerprintProps {
  readonly bars: readonly FingerprintBar[]
  /** Borne haute de l'échelle (10 pour mood_tracker). */
  readonly yMax: number
  /** Hauteur de la zone de barres en px (défaut 44). */
  readonly barAreaHeight?: number
  readonly testID?: string
}

const DEFAULT_BAR_AREA = 44
// Hauteur minimale d'une barre non nulle, pour qu'une valeur de 1 reste visible.
const MIN_BAR_RATIO = 0.12

export const DimensionFingerprint = React.memo(function DimensionFingerprint({
  bars, yMax, barAreaHeight = DEFAULT_BAR_AREA, testID,
}: DimensionFingerprintProps) {
  const safeMax = yMax > 0 ? yMax : 1
  const heights = useMemo(
    () => bars.map(b => {
      if (b.value == null || b.value <= 0) return 0
      const ratio = Math.max(MIN_BAR_RATIO, Math.min(b.value / safeMax, 1))
      return ratio * barAreaHeight
    }),
    [bars, safeMax, barAreaHeight]
  )

  return (
    <View style={styles.row} testID={testID}>
      {bars.map((bar, i) => (
        <View key={bar.key} style={styles.col}>
          <Text style={styles.value}>{bar.value ?? '-'}</Text>
          <View style={[styles.track, { height: barAreaHeight }]}>
            <View
              style={[
                styles.bar,
                { height: heights[i], backgroundColor: bar.color },
              ]}
              testID={testID != null ? `${testID}-bar-${bar.key}` : undefined}
            />
          </View>
          <Text style={styles.label} numberOfLines={1}>{bar.label}</Text>
        </View>
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  col: { flex: 1, alignItems: 'center', gap: 3 },
  value: { fontSize: 13, fontWeight: '700', color: colors.text },
  track: { width: '100%', justifyContent: 'flex-end', alignItems: 'stretch' },
  bar: { width: '100%', borderRadius: radius.sm, minHeight: 2 },
  label: { fontSize: 11, color: colors.textMuted },
})
