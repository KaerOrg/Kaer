import React, { useCallback, useMemo } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Card } from '@ui/Card'
import type { FearSituation } from '../../../../../lib/database'
import type { ExposureConfig } from './types'
import { etStyles } from './styles'

export interface LadderRowProps {
  step: FearSituation
  count: number
  /** Dernier pic enregistré (null = pas encore essayée). */
  lastPeak: number | null
  config: ExposureConfig
  lbl: (k: string, opts?: Record<string, string | number>) => string
  onOpen: (id: string) => void
}

/**
 * Une marche de l'échelle (carte passive) : barre de difficulté proportionnelle,
 * « Difficulté initiale estimée X », pastille « Dernier pic X » ou « Pas encore
 * essayée », nombre d'expositions. Aucune coche, aucune valence (#183).
 */
export const LadderRow = React.memo(function LadderRow({
  step, count, lastPeak, config, lbl, onOpen,
}: LadderRowProps) {
  const handlePress = useCallback(() => onOpen(step.id), [onOpen, step.id])

  const fillStyle = useMemo(() => {
    const span = Math.max(1, config.sudsMax - config.sudsMin)
    const target = step.target_suds ?? config.sudsMin
    const pct = Math.max(0, Math.min(100, ((target - config.sudsMin) / span) * 100))
    return { width: `${pct}%` as `${number}%`, backgroundColor: config.ladderBarColor }
  }, [step.target_suds, config.sudsMin, config.sudsMax, config.ladderBarColor])

  const chipStyle = useMemo(
    () => [etStyles.lastPeakChip, { backgroundColor: config.lastPeakTextColor + '1A' }],
    [config.lastPeakTextColor],
  )
  const chipTextStyle = useMemo(
    () => [etStyles.lastPeakChipText, { color: config.lastPeakTextColor }],
    [config.lastPeakTextColor],
  )

  return (
    <Card onPress={handlePress} accessibilityLabel={step.label} testID={`step-${step.id}`}>
      <View style={etStyles.ladderTitleRow}>
        <Text style={etStyles.ladderRowTitle} numberOfLines={2}>{step.label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </View>

      {step.target_suds != null ? (
        <View style={etStyles.ladderDiffTrack}>
          <View style={[etStyles.ladderDiffFill, fillStyle]} />
        </View>
      ) : null}

      <View style={etStyles.ladderRowMeta}>
        <Text style={etStyles.ladderMetaText} numberOfLines={1}>
          {lbl('step_difficulty', { value: step.target_suds ?? 0 })}
        </Text>
        {lastPeak != null ? (
          <View style={chipStyle}>
            <Text style={chipTextStyle} numberOfLines={1}>{lbl('step_last_peak', { value: lastPeak })}</Text>
          </View>
        ) : (
          <Text style={etStyles.notTriedText} numberOfLines={1}>{lbl('step_not_tried')}</Text>
        )}
      </View>

      <Text style={etStyles.ladderSessions}>{lbl('step_sessions', { n: count })}</Text>
    </Card>
  )
})
