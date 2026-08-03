import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { Sheet } from '@ui/Sheet'
import { Chip } from '@ui/Chip'
import { Button } from '@ui/Button'
import type { BreathingTechnique } from '@services/breathingService'
import { rhythmChipLabels } from './rhythmLabels'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

export interface TechniqueInfoSheetProps {
  visible: boolean
  technique: BreathingTechnique
  onClose: () => void
  lbl: LabelFn
  /** `common.close`, résolu par le layout. */
  closeLabel: string
}

/**
 * « En savoir plus » d'une technique. C'est **ici, et seulement ici**, que les
 * preuves scientifiques apparaissent côté patient : les cartes du hub portent un
 * bénéfice en langage courant, jamais une citation (epic #195).
 *
 * Les références restent repliées par défaut : le patient ouvre s'il le souhaite.
 */
export const TechniqueInfoSheet = memo(function TechniqueInfoSheet({
  visible, technique, onClose, lbl, closeLabel,
}: TechniqueInfoSheetProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const chips = useMemo(() => rhythmChipLabels(technique.phases, lbl), [technique.phases, lbl])

  // Les références se replient à chaque réouverture : elles ne sont jamais l'entrée
  // en matière, y compris après une première consultation.
  useEffect(() => {
    if (!visible) setSourcesOpen(false)
  }, [visible])

  const toggleSources = useCallback(() => setSourcesOpen(prev => !prev), [])

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={closeLabel}
      title={lbl(`${technique.key}_name`)}
      subtitle={lbl(`${technique.key}_benefit`)}
      scrollable
      testID="breathing-info-sheet"
    >
      <View style={hubStyles.rhythmChips}>
        {chips.map(chip => (
          <Chip key={chip} label={chip} size="sm" color={technique.color} selected />
        ))}
      </View>

      <Text style={hubStyles.primaryBenefit}>{lbl(`${technique.key}_description`)}</Text>

      <Button
        variant="ghost"
        size="sm"
        label={lbl('info_sources_toggle')}
        onPress={toggleSources}
        accessibilityLabel={lbl('info_sources_toggle')}
        testID="breathing-info-sources-toggle"
      />
      {sourcesOpen ? (
        <Text style={hubStyles.sheetNote} testID="breathing-info-sources">
          {lbl(`${technique.key}_evidence`)}
        </Text>
      ) : null}
    </Sheet>
  )
})
