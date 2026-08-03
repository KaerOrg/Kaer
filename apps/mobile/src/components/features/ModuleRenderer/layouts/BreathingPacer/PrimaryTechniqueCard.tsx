import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Card } from '@ui/Card'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { colors } from '@theme'
import { getCycleDuration, type BreathingTechnique } from '@services/breathingService'
import { BreathingPulse } from './BreathingPulse'
import { rhythmChipLabels } from './rhythmLabels'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

export interface PrimaryTechniqueCardProps {
  /** La technique travaillée en séance (`primary_technique`). */
  technique: BreathingTechnique
  /** Durée proposée au démarrage, en minutes (`preferred_duration_min`). */
  durationMin: number
  /** Sous-texte de dernière session, déjà formaté. `null` = aucune session. */
  lastSessionLabel: string | null
  lbl: LabelFn
  onStart: () => void
  /** Ouvre « En savoir plus » : c'est là, et seulement là, que vivent les preuves. */
  onInfo: () => void
}

/**
 * Carte de tête du hub : la technique que le patient a travaillée en séance avec
 * son praticien. Elle porte un bénéfice en une ligne, orienté patient, jamais une
 * citation scientifique, qui vit derrière « En savoir plus ».
 */
export const PrimaryTechniqueCard = memo(function PrimaryTechniqueCard({
  technique, durationMin, lastSessionLabel, lbl, onStart, onInfo,
}: PrimaryTechniqueCardProps) {
  const chips = useMemo(() => rhythmChipLabels(technique.phases, lbl), [technique.phases, lbl])
  const inhaleSeconds = technique.phases.find((p) => p.type === 'inhale')?.seconds ?? 1
  const cycleSeconds = getCycleDuration(technique)
  const startStyle = useMemo(
    () => [hubStyles.startBtn, { backgroundColor: technique.color }],
    [technique.color],
  )
  const eyebrowStyle = useMemo(
    () => [hubStyles.eyebrow, { color: colors.primaryDark }],
    [],
  )

  return (
    <Card variant="elevated" testID="breathing-primary-card">
      <View style={hubStyles.eyebrowRow}>
        <Text style={eyebrowStyle}>{lbl('hub_in_session')}</Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={onInfo}
          accessibilityLabel={lbl('hub_info_label')}
          testID="breathing-info-btn"
          iconLeft={<MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />}
        />
      </View>

      <View style={hubStyles.primaryRow}>
        <BreathingPulse
          color={technique.color}
          inhaleSeconds={inhaleSeconds}
          cycleSeconds={cycleSeconds}
          testID="breathing-pulse"
        />
        <View style={hubStyles.primaryTexts}>
          <Text style={hubStyles.primaryName}>{lbl(`${technique.key}_name`)}</Text>
          <Text style={hubStyles.primaryBenefit}>{lbl(`${technique.key}_benefit`)}</Text>
          <View style={hubStyles.rhythmChips}>
            {chips.map((chip) => (
              <Chip key={chip} label={chip} size="sm" color={technique.color} selected />
            ))}
          </View>
        </View>
      </View>

      <Button
        label={lbl('hub_start_btn', { min: durationMin })}
        onPress={onStart}
        style={startStyle}
        accessibilityLabel={lbl('hub_start_btn', { min: durationMin })}
        testID="breathing-start-btn"
        iconLeft={<MaterialCommunityIcons name="play" size={18} color={colors.text} />}
      />

      <Text style={hubStyles.lastSession}>
        {lastSessionLabel ?? lbl('hub_last_session_none')}
      </Text>
    </Card>
  )
})
