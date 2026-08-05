import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { Sheet } from '@ui/Sheet'
import { Chip } from '@ui/Chip'
import { Button } from '@ui/Button'
import type { BreathingTechnique, TechniqueInfoBlock } from '@services/breathingService'
import { InfoBlock } from './InfoBlock'
import { rhythmChipLabels } from './rhythmLabels'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

export interface TechniqueInfoSheetProps {
  visible: boolean
  technique: BreathingTechnique
  /** Blocs déclarés en base pour cette technique, dans l'ordre. */
  blocks: readonly TechniqueInfoBlock[]
  onClose: () => void
  lbl: LabelFn
  /** Résout une clé i18n complète (les blocs en portent, pas des fragments). */
  t: (key: string) => string
  /** `common.close`, résolu par le layout. */
  closeLabel: string
}

/**
 * « En savoir plus » d'une technique. C'est **ici, et seulement ici**, que les
 * preuves scientifiques apparaissent côté patient : les cartes du hub et les lignes
 * de la liste portent un bénéfice en langage courant, jamais une citation.
 *
 * Le contenu vient de la base (`technique_info`), pas du code : la feuille reçoit des
 * blocs et n'en dérive aucune clé elle-même. Ajouter un paragraphe à une technique
 * est un INSERT, pas un déploiement.
 *
 * Les références restent repliées par défaut : le patient ouvre s'il le souhaite.
 */
export const TechniqueInfoSheet = memo(function TechniqueInfoSheet({
  visible, technique, blocks, onClose, lbl, t, closeLabel,
}: TechniqueInfoSheetProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const chips = useMemo(() => rhythmChipLabels(technique.phases, lbl), [technique.phases, lbl])
  const body = useMemo(() => blocks.filter(block => block.section === 'body'), [blocks])
  const sources = useMemo(() => blocks.filter(block => block.section === 'sources'), [blocks])

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
      <View>
        <Text style={hubStyles.sheetLabel}>{lbl('info_label_rhythm')}</Text>
        <View style={hubStyles.rhythmChips}>
          {chips.map(chip => (
            <Chip key={chip} label={chip} size="sm" color={technique.color} selected />
          ))}
        </View>
      </View>

      {body.map(block => (
        <InfoBlock key={block.id} block={block} t={t} />
      ))}

      {sources.length > 0 ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            label={lbl('info_sources_toggle')}
            onPress={toggleSources}
            accessibilityLabel={lbl('info_sources_toggle')}
            testID="breathing-info-sources-toggle"
          />
          {sourcesOpen ? (
            <View testID="breathing-info-sources">
              {sources.map(block => (
                <Text key={block.id} style={hubStyles.sheetNote}>{t(block.textCode)}</Text>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Sheet>
  )
})
