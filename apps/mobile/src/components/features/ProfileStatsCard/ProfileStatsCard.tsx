import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@ui/Card'
import { colors, spacing, fonts } from '@theme'

export interface ProfileStat {
  /** Valeur brute déjà formatée (ex. « 28 », « 3 », « 92 % »). */
  value: string
  /** Libellé descriptif (déjà traduit). */
  label: string
}

interface ProfileStatsCardProps {
  /** 2 ou 3 colonnes. Valeurs BRUTES, neutres (MDR) : aucun code couleur de gravité. */
  stats: ProfileStat[]
}

/**
 * Résumé de suivi en carte blanche : colonnes séparées par des filets verticaux,
 * chiffre serif turquoise + libellé atténué. Descriptif uniquement — la couleur
 * est une identité de marque, jamais une sémantique de seuil clinique (MDR 2017/745).
 */
export const ProfileStatsCard = React.memo(function ProfileStatsCard({ stats }: ProfileStatsCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.col}>
              <Text style={styles.value}>{stat.value}</Text>
              <Text style={styles.label}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </Card>
  )
})

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  col: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  divider: { width: 1, backgroundColor: colors.neutral, alignSelf: 'stretch' },
  // `primaryDark` (≈ 5.9:1 sur blanc) plutôt que `primary` (≈ 2.1:1) : le chiffre
  // porte de l'information → contraste AA requis. Couleur = identité, pas gravité.
  value: { fontSize: 26, fontWeight: '700', color: colors.primaryDark, fontFamily: fonts.serif },
  label: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
})
