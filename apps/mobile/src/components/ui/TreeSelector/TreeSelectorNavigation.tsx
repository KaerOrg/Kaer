// Mode « sélection » du primitive TreeSelector : navigation niveau par niveau.
// Niveau 1 = grille de cartes (familles racines) ; niveaux suivants = liste.
// Si la profondeur libre est activée, propose un bouton « valider ici ».

import { useMemo } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccentColor, buildBreadcrumb } from './helpers'
import type { McIcon, TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'
import { styles } from './styles'

interface TreeSelectorNavigationProps {
  nodes: TreeSelectorNode[]
  path: TreeSelectorNode[]
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  footerText?: string | null
  onBack: () => void
  onSelectNode: (node: TreeSelectorNode) => void
  onValidateHere: () => void
}

export function TreeSelectorNavigation({
  nodes, path, config, texts, footerText, onBack, onSelectNode, onValidateHere,
}: TreeSelectorNavigationProps) {
  const accentColor = resolveAccentColor(path)
  const breadcrumb = buildBreadcrumb(path)
  const level = path.length + 1
  const progress = level / Math.max(level, 3)
  const tintStyle = path.length > 0 ? { backgroundColor: accentColor + '08' } : null

  const currentNodes = useMemo(
    () => (path.length === 0 ? nodes : path[path.length - 1].children),
    [nodes, path],
  )

  // Niveau 2 : le titre est la famille racine choisie ; sinon, titre configuré.
  const stepTitle = level === 2 && path.length >= 1 ? path[0].label : (texts.stepTitles[level] ?? '')
  const stepHint = texts.stepHints[level] ?? ''

  const showValidate = config.enableEarlyValidate && path.length > 0 && currentNodes.length > 0
  const lastLabel = path.length > 0 ? path[path.length - 1].label : ''
  const validateLabel = lastLabel ? `${texts.validateHereBtn} : ${lastLabel}` : texts.validateHereBtn

  return (
    <View style={[styles.container, tintStyle]}>
      <TreeSelectorHeader
        onBack={onBack}
        showProgress
        accentColor={accentColor}
        breadcrumb={breadcrumb}
        progress={progress}
        backLabel={texts.back}
      />
      <ScrollView contentContainerStyle={styles.selectionContent}>
        {stepTitle ? <Text style={styles.stepTitle}>{stepTitle}</Text> : null}
        {stepHint ? <Text style={styles.stepHint}>{stepHint}</Text> : null}

        {level === 1 ? (
          <View style={styles.gridContainer} testID="level-1-grid">
            {currentNodes.map(node => {
              const nodeColor = node.color ?? colors.primary
              return (
                <Pressable
                  key={node.id}
                  style={({ pressed }) => [
                    styles.primaryCard,
                    { borderColor: nodeColor, backgroundColor: nodeColor + '12' },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => onSelectNode(node)}
                  accessibilityRole="button"
                  accessibilityLabel={node.label}
                  testID={`node-${node.id}`}
                >
                  <View style={[styles.primaryIconCircle, { backgroundColor: nodeColor + '22' }]}>
                    {node.emoji ? (
                      <Text style={styles.primaryEmoji}>{node.emoji}</Text>
                    ) : (
                      <MaterialCommunityIcons
                        name={(node.icon ?? 'circle-outline') as McIcon}
                        size={26}
                        color={nodeColor}
                      />
                    )}
                  </View>
                  <Text style={[styles.primaryLabel, { color: nodeColor }]}>{node.label}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View style={styles.listContainer} testID={`level-${level}-list`}>
            {currentNodes.map(node => {
              const nodeColor = node.color ?? accentColor
              return (
                <Pressable
                  key={node.id}
                  style={({ pressed }) => [
                    styles.optionCard,
                    { borderLeftColor: nodeColor },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => onSelectNode(node)}
                  accessibilityRole="button"
                  accessibilityLabel={node.label}
                  testID={`node-${node.id}`}
                >
                  <Text style={[styles.optionLabel, { color: nodeColor }]}>{node.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                </Pressable>
              )
            })}
          </View>
        )}

        {showValidate ? (
          <Pressable
            style={[styles.validateHereBtn, { borderColor: accentColor }]}
            onPress={onValidateHere}
            accessibilityRole="button"
            accessibilityLabel={validateLabel}
            testID="validate-here"
          >
            <MaterialCommunityIcons name="check" size={18} color={accentColor} />
            <Text style={[styles.validateHereText, { color: accentColor }]}>{validateLabel}</Text>
          </Pressable>
        ) : null}

        {level === 1 && footerText ? (
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>{footerText}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
