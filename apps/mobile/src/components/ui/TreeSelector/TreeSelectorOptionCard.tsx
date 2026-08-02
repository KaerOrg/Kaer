// Carte d'option des niveaux ≥ 2 du primitive `TreeSelector`.
//
// Deux comportements selon le nœud :
//   · nœud SANS feuille : un tap le sélectionne et enchaîne (c'est ce qui tient la
//     saisie en trois taps) ;
//   · nœud AVEC feuilles : un tap le déplie sur place et montre ses feuilles en
//     chips, au lieu d'ouvrir un écran de plus. Un tap sur une chip sélectionne la
//     feuille ; le bouton « continuer » du bas valide la carte sans descendre.
//
// La définition, quand elle existe, s'affiche sous le titre : le patient choisit sur
// du sens, pas sur un mot nu (K-5).

import { View, Text, Pressable } from 'react-native'
import { Chip } from '../Chip/Chip'
import type { TreeSelectorNode } from './types'
import { styles } from './styles'

interface TreeSelectorOptionCardProps {
  node: TreeSelectorNode
  /** Teinte héritée du chemin (identité de famille) : filet gauche uniquement. */
  accentColor: string
  expanded: boolean
  onPress: (node: TreeSelectorNode) => void
  onSelectLeaf: (leaf: TreeSelectorNode) => void
}

export function TreeSelectorOptionCard({
  node, accentColor, expanded, onPress, onSelectLeaf,
}: TreeSelectorOptionCardProps) {
  const nodeColor = node.color ?? accentColor
  const hasLeaves = node.children.length > 0

  return (
    <View
      style={[
        styles.optionCard,
        { borderLeftColor: nodeColor },
        expanded ? { backgroundColor: nodeColor + '14', borderColor: nodeColor } : null,
      ]}
      testID={`option-${node.id}`}
    >
      <Pressable
        onPress={() => onPress(node)}
        accessibilityRole="button"
        accessibilityLabel={node.definition ? `${node.label}, ${node.definition}` : node.label}
        accessibilityState={hasLeaves ? { expanded } : undefined}
        testID={`node-${node.id}`}
      >
        <Text style={styles.optionLabel}>{node.label}</Text>
        {node.definition ? (
          <Text style={styles.optionDefinition}>{node.definition}</Text>
        ) : null}
      </Pressable>

      {expanded && hasLeaves ? (
        <View style={styles.optionChips} testID={`chips-of-${node.id}`}>
          {node.children.map(leaf => (
            <Chip
              key={leaf.id}
              label={leaf.label}
              size="sm"
              onPress={() => onSelectLeaf(leaf)}
              testID={`leaf-${leaf.id}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
