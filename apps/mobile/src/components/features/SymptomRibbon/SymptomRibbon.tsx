import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'
import { ribbonCellOpacity } from '@kaer/shared'
import type { RibbonGrid } from './ribbonGrid'

// ─── Ruban multi-symptômes — heatmap N dimensions × jours du mois ────────────
//
// Remplace l'ancienne vue mensuelle mono-score. Chaque cellule porte UNE teinte
// (celle de la dimension), opacité proportionnelle à la valeur brute (magnitude
// seule — MDR 2017/745). Jour non renseigné = cellule vide à contour clair : les
// lacunes se lisent d'un coup d'œil, aucune valeur n'est inventée.
//
// Largeur fluide : la colonne de libellés est bornée, les cellules sont `flex: 1`
// — jamais de scroll horizontal, quel que soit le nombre de jours (28 à 31).

export interface RibbonDimension {
  readonly key: string
  readonly label: string
  /** Mi-teinte de la dimension. */
  readonly color: string
}

export interface SymptomRibbonProps {
  readonly dimensions: readonly RibbonDimension[]
  readonly grid: RibbonGrid
  readonly yMax: number
  /** Ex. « Vue par symptôme · 28 j. » (résolu par le parent). */
  readonly title: string
  /** Ex. « 20/28 saisis » (résolu par le parent). */
  readonly assiduityLabel: string
  readonly legendLabel: string
  readonly testID?: string
}

export const SymptomRibbon = React.memo(function SymptomRibbon({
  dimensions, grid, yMax, title, assiduityLabel, legendLabel, testID,
}: SymptomRibbonProps) {
  const rowByKey = new Map(grid.rows.map(r => [r.key, r.values]))

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.assiduity}>{assiduityLabel}</Text>
      </View>

      <View style={styles.grid}>
        {dimensions.map(dim => {
          const values = rowByKey.get(dim.key) ?? []
          return (
            <View key={dim.key} style={styles.gridRow}>
              <View style={styles.rowLabelWrap}>
                <View style={[styles.rowDot, { backgroundColor: dim.color }]} />
                <Text style={styles.rowLabel} numberOfLines={1}>{dim.label}</Text>
              </View>
              <View style={styles.cells}>
                {values.map((value, i) => {
                  const opacity = ribbonCellOpacity(value, yMax)
                  return (
                    <View
                      key={i}
                      style={[
                        styles.cell,
                        opacity == null
                          ? styles.cellEmpty
                          : { backgroundColor: dim.color, opacity },
                      ]}
                    />
                  )
                })}
              </View>
            </View>
          )
        })}
      </View>

      <Text style={styles.legend}>{legendLabel}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  assiduity: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  grid: { gap: 3 },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 76 },
  rowDot: { width: 7, height: 7, borderRadius: 3.5 },
  rowLabel: { fontSize: 12, color: colors.text, flexShrink: 1 },

  cells: { flex: 1, flexDirection: 'row', gap: 1 },
  cell: { flex: 1, height: 16, borderRadius: 2 },
  cellEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },

  legend: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
})
