import { memo } from 'react'
import { View, Text } from 'react-native'
import type { TechniqueInfoBlock } from '@services/breathingService'
import { hubStyles } from './hubStyles'

export interface InfoBlockProps {
  /** Le bloc déclaré en base : titre et texte sont des clés i18n. */
  block: TechniqueInfoBlock
  /** Résout une clé i18n complète. */
  t: (key: string) => string
}

/**
 * Un paragraphe de « En savoir plus » : son titre, puis son texte. Les deux viennent
 * de la base sous forme de clés i18n, aucune n'est construite ici.
 */
export const InfoBlock = memo(function InfoBlock({ block, t }: InfoBlockProps) {
  return (
    <View testID={`breathing-info-block-${block.id}`}>
      {block.labelCode != null ? (
        <Text style={hubStyles.sheetLabel}>{t(block.labelCode)}</Text>
      ) : null}
      <Text style={hubStyles.primaryBenefit}>{t(block.textCode)}</Text>
    </View>
  )
})
