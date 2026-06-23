import React, { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { TFunction } from 'i18next'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Card } from '@ui/Card'
import { Button } from '@ui/Button'
import { colors, spacing, radius, typography } from '@theme'
import { formatDateLong } from '../../../lib/dateUtils'
import type { ScaleEntry } from '../../../lib/database'
import type { ScaleScoringConfig } from '../../../lib/scaleScoring'

const TRASH_ICON = <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.textMuted} />

export interface EntryCardProps {
  entry: ScaleEntry
  scaleId: string
  config: ScaleScoringConfig | undefined
  accentColor: string | undefined
  isTeenMode: boolean
  t: TFunction
  onOpen: (entryId: string) => void
  onDelete: (entryId: string) => void
}

/** Carte d'une saisie dans l'historique d'échelle : date, score, chips de sous-scores. */
export const EntryCard = React.memo(function EntryCard({
  entry, scaleId, config, accentColor, isTeenMode, t, onOpen, onDelete,
}: EntryCardProps) {
  const handleOpen = useCallback(() => onOpen(entry.id), [onOpen, entry.id])
  const handleDelete = useCallback(() => onDelete(entry.id), [onDelete, entry.id])

  const decimals = config?.score_decimals ?? 0
  const displayScore = decimals > 0
    ? entry.total_score.toFixed(decimals)
    : String(Math.round(entry.total_score))
  const entryAccent = isTeenMode && accentColor != null ? accentColor : colors.primary

  return (
    <Card onPress={handleOpen} accessibilityLabel={t('common.modify')}>
      <View style={styles.row}>
        <View style={styles.main}>
          <Text style={styles.date}>{formatDateLong(entry.created_at)}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{t(`modules.${scaleId}.score_label`)}</Text>
            <Text style={[styles.scoreValue, { color: entryAccent }]}>
              {displayScore}
              <Text style={styles.scoreMax}> {t(`modules.${scaleId}.score_max`)}</Text>
            </Text>
          </View>
          {config?.chips != null && entry.subscale_scores != null && (
            <View style={styles.chips}>
              {config.chips.map(chipKey => {
                const subscaleKey = config.chipSubscaleKeys?.[chipKey]
                const subscaleValue = subscaleKey != null ? entry.subscale_scores![subscaleKey] : undefined
                if (subscaleValue === undefined) return null
                return (
                  <View key={chipKey} style={styles.chip}>
                    <Text style={styles.chipKey}>{t(`modules.${scaleId}.${chipKey}`)}</Text>
                    <Text style={styles.chipValue}>{subscaleValue}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <MaterialCommunityIcons name="pencil-outline" size={17} color={entryAccent} />
          <Button
            variant="ghost"
            onPress={handleDelete}
            accessibilityLabel={t('common.delete')}
            iconLeft={TRASH_ICON}
          />
        </View>
      </View>
    </Card>
  )
})

export default EntryCard

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1 },
  date: { ...typography.caption, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  actions: { flexDirection: 'column', alignItems: 'center', gap: 10, paddingLeft: spacing.sm },
  chips: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.neutral, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  chipValue: { fontSize: 11, color: colors.text },
})
