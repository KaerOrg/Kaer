// Mode « intensité » du primitive TreeSelector : sélecteur de valeur brute
// (1–N) parmi `config.intensityValues`. Aucune couleur de gravité — la teinte
// reflète la famille choisie (conformité MDR : valeur brute, jamais interprétée).

import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccentColor, buildBreadcrumb } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'
import { styles } from './styles'

// États d'accessibilité figés hors du render : la sélection n'est plus portée par
// la seule couleur de fond depuis la passe K-10 (un lecteur d'écran doit l'entendre).
const ACTIVE_STATE = { on: { selected: true }, off: { selected: false } } as const

interface TreeSelectorIntensityProps {
  path: TreeSelectorNode[]
  intensity: number
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  onBack: () => void
  onChangeIntensity: (v: number) => void
  onConfirm: () => void
}

export function TreeSelectorIntensity({
  path, intensity, config, texts, onBack, onChangeIntensity, onConfirm,
}: TreeSelectorIntensityProps) {
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
        {texts.intensityTitle ? <Text style={styles.stepTitle}>{texts.intensityTitle}</Text> : null}
        {texts.intensityHint ? <Text style={styles.stepHint}>{texts.intensityHint}</Text> : null}

        <View style={styles.intensityCard} testID="intensity-card">
          <View style={styles.intensityDisplay}>
            <Text style={styles.intensityValue} testID="intensity-value">
              {intensity}
            </Text>
            <Text style={styles.intensityMax}>/{config.intensityMax}</Text>
          </View>
          <View style={styles.intensityBtns}>
            {config.intensityValues.map(v => {
              const isActive = intensity === v
              return (
                <Pressable
                  key={v}
                  style={[styles.intensityBtn, isActive ? styles.intensityBtnActive : null]}
                  onPress={() => onChangeIntensity(v)}
                  accessibilityRole="button"
                  accessibilityLabel={String(v)}
                  accessibilityState={ACTIVE_STATE[isActive ? 'on' : 'off']}
                  testID={`intensity-btn-${v}`}
                >
                  <Text style={styles.intensityBtnText}>{v}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Pressable
          style={styles.continueBtn}
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={texts.continueBtn}
          testID="continue-intensity"
        >
          <Text style={styles.continueBtnText}>{texts.continueBtn}</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.text} />
        </Pressable>
      </ScrollView>
    </View>
  )
}
