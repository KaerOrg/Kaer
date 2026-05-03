import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../theme'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

interface Props {
  title: string
  tagline: string
  Icon: LucideIcon
  accentColor: string
  keyInsight: string
}

export function PsyEduDetailHeader({ title, tagline, Icon, accentColor, keyInsight }: Props) {
  return (
    <>
      {/* En-tête coloré pleine largeur */}
      <View style={[styles.header, { backgroundColor: accentColor }]}>
        <View style={styles.iconWrap}>
          <Icon size={44} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerTagline}>{tagline}</Text>
      </View>

      {/* Carte "Point clé" flottante */}
      <View style={styles.keyInsightWrapper}>
        <View style={[styles.keyInsightCard, { borderLeftColor: accentColor }]}>
          <Text style={[styles.keyInsightLabel, { color: accentColor }]}>POINT CLÉ</Text>
          <Text style={styles.keyInsightText}>{keyInsight}</Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: 52,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  headerTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  keyInsightWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: -32,
    marginBottom: spacing.md,
  },
  keyInsightCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  keyInsightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  keyInsightText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
})
