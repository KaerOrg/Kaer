// Mode « contexte » du primitive TreeSelector : chips multi-choix facultatifs.
// Les codes sélectionnés sont renvoyés tels quels au parent (identités opaques).

import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Chip } from '../Chip/Chip'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccentColor, buildBreadcrumb } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'
import { styles } from './styles'

interface TreeSelectorContextProps {
  path: TreeSelectorNode[]
  context: string[]
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  onBack: () => void
  onToggleContext: (code: string) => void
  onConfirm: () => void
}

export function TreeSelectorContext({
  path, context, config, texts, onBack, onToggleContext, onConfirm,
}: TreeSelectorContextProps) {
  const accentColor = resolveAccentColor(path)
  const breadcrumb = buildBreadcrumb(path)
  const tintStyle = path.length > 0 ? { backgroundColor: accentColor + '08' } : null

  return (
    <View style={[styles.container, tintStyle]}>
      <TreeSelectorHeader
        onBack={onBack}
        showProgress={false}
        accentColor={accentColor}
        breadcrumb={breadcrumb}
        progress={0}
        backLabel={texts.back}
      />
      <ScrollView contentContainerStyle={styles.selectionContent}>
        {texts.contextTitle ? <Text style={styles.stepTitle}>{texts.contextTitle}</Text> : null}
        {texts.contextHint ? <Text style={styles.stepHint}>{texts.contextHint}</Text> : null}

        <View style={styles.chipsWrap} testID="context-chips">
          {config.contextOptions.map(opt => {
            const isActive = context.includes(opt.code)
            return (
              <Chip
                key={opt.code}
                label={opt.label}
                selected={isActive}
                color={accentColor}
                onPress={() => onToggleContext(opt.code)}
                testID={`context-${opt.code}`}
                icon={
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={16}
                    color={isActive ? accentColor : colors.textMuted}
                  />
                }
              />
            )
          })}
        </View>

        <Pressable
          style={[styles.continueBtn, { backgroundColor: accentColor }]}
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={texts.continueBtn}
          testID="continue-context"
        >
          <Text style={styles.continueBtnText}>{texts.continueBtn}</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
        </Pressable>
      </ScrollView>
    </View>
  )
}
