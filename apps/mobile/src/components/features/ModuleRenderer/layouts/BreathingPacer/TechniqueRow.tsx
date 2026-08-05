import { memo, useCallback, useMemo } from 'react'
import { View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Card } from '@ui/Card'
import { Button } from '@ui/Button'
import { colors } from '@theme'
import type { BreathingTechnique } from '@services/breathingService'
import { rhythmSummary } from './rhythmLabels'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

export interface TechniqueRowProps {
  technique: BreathingTechnique
  lbl: LabelFn
  /** Reçoit la clé de la technique : le parent n'a pas à créer une lambda par ligne. */
  onOpen: (techniqueKey: string) => void
  /** Ouvre « En savoir plus » pour cette technique, sans lancer de session. */
  onInfo: (techniqueKey: string) => void
}

/**
 * Une technique de la liste « Vos techniques ». N'y figurent que les techniques
 * **activées par le praticien** : aucune ligne verrouillée, aucun teaser.
 *
 * La surface entière est cliquable : c'est le primitive de surface `ui/Card` qui la
 * porte, pas un `Pressable` réassemblé.
 */
export const TechniqueRow = memo(function TechniqueRow({
  technique, lbl, onOpen, onInfo,
}: TechniqueRowProps) {
  const handlePress = useCallback(() => onOpen(technique.key), [onOpen, technique.key])
  const handleInfo = useCallback(() => onInfo(technique.key), [onInfo, technique.key])
  const ringStyle = useMemo(
    () => [hubStyles.techniqueRing, { borderColor: technique.color }],
    [technique.color],
  )
  const name = lbl(`${technique.key}_name`)

  return (
    <Card
      variant="elevated"
      onPress={handlePress}
      accessibilityLabel={name}
      testID={`breathing-technique-${technique.key}`}
    >
      <View style={hubStyles.techniqueRow}>
        <View style={ringStyle} />
        <View style={hubStyles.techniqueTexts}>
          <Text style={hubStyles.techniqueName}>{name}</Text>
          <Text style={hubStyles.techniqueBenefit}>{lbl(`${technique.key}_benefit`)}</Text>
        </View>
        <Text style={hubStyles.techniqueRhythm}>{rhythmSummary(technique.phases)}</Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={handleInfo}
          accessibilityLabel={lbl('hub_info_label')}
          testID={`breathing-info-${technique.key}`}
          iconLeft={<MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />}
        />
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </View>
    </Card>
  )
})
