// ─── Lien « Traverser la vague » vers `distress_tolerance` (P-9) ─────────────
//
// Barreau intermédiaire de la Séquence : entre suivre son plan et appeler les
// secours, il reste un geste, accompagné d'un minuteur.
//
// **Le lien n'existe que si le module est déverrouillé pour ce patient, et sinon il
// DISPARAÎT — il ne se grise pas.** Un lien grisé annoncerait un outil qu'on refuse,
// ce qui est le contraire de l'intention : le déverrouillage est une décision de
// clinicien prise sur cette personne, pas un calcul, et pas un manque à signaler.
//
// **Le libellé décrit le mécanisme, jamais un bénéfice** : « un minuteur m'accompagne
// 5 ou 15 minutes » est descriptif ; « ça va t'aider à te calmer » serait une
// allégation, donc une bascule réglementaire.
//
// Le libellé vient des clés du module CIBLE, pas de `crisis_plan` : c'est lui qui
// nomme ce qu'il propose.

import React, { useCallback } from 'react'
import { Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Card } from '@ui/Card'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { AppStackParamList } from '../../../../../navigation/AppStack'
import { styles } from './styles'

type Nav = NativeStackNavigationProp<AppStackParamList>

/** Module cible et écran atteint : l'onglet « Agir en crise » (compagnon de crise). */
const TARGET_MODULE = 'distress_tolerance'

export interface DistressToleranceLinkProps {
  testID?: string
}

export const DistressToleranceLink = React.memo(function DistressToleranceLink({
  testID,
}: DistressToleranceLinkProps) {
  const t = useModuleTranslation()
  const navigation = useNavigation<Nav>()
  const label = t(`modules.${TARGET_MODULE}.crisis_link_label`)
  const hint = t(`modules.${TARGET_MODULE}.crisis_link_hint`)

  const handlePress = useCallback(() => {
    // `previewKindOverride` ouvre directement le compagnon de crise, sans passer par
    // l'onglet « Comprendre » : en crise, on n'arrive pas sur une page de lecture.
    navigation.navigate('ModuleContent', {
      moduleType: TARGET_MODULE,
      previewKindOverride: 'crisis_companion',
    })
  }, [navigation])

  return (
    <Card onPress={handlePress} accessibilityLabel={label} testID={testID}>
      <Text style={styles.entryLabel}>{label}</Text>
      <Text style={styles.entryHint}>{hint}</Text>
    </Card>
  )
})
