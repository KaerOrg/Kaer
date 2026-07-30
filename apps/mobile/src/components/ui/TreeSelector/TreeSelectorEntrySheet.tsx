// Fiche unique du primitive `TreeSelector` (K-6) : les trois étapes facultatives
// — intensité, contexte, note — sur un seul écran scrollable, « enregistrer » en bas.
//
// Trois écrans traversés en file indienne étaient le premier prédicteur d'abandon,
// et la note libre, le champ le plus riche cliniquement, se retrouvait enterrée
// derrière deux écrans qu'on pouvait sauter sans les lire.
//
// Conformité MDR : l'intensité est un chiffre brut. Aucune valeur par défaut (une
// valeur pré-cochée serait une réponse que le patient n'a pas donnée), aucune
// couleur de seuil, aucun label interprétatif. Les ancrages bornent l'échelle, ils
// ne qualifient pas la valeur.

import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Chip } from '../Chip/Chip'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccentColor, buildBreadcrumb } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'
import { styles } from './styles'

interface TreeSelectorEntrySheetProps {
  path: TreeSelectorNode[]
  intensity: number | null
  context: string[]
  contextOther: string
  contextOtherOpen: boolean
  notes: string
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  saving: boolean
  onBack: () => void
  onChangeIntensity: (v: number | null) => void
  onToggleContext: (code: string) => void
  onToggleContextOther: () => void
  onChangeContextOther: (v: string) => void
  onChangeNotes: (v: string) => void
  onCancel: () => void
  onSave: () => void
}

// États d'accessibilité figés hors du render : la sélection n'est pas portée par la
// seule couleur de fond, un lecteur d'écran doit l'entendre.
const SELECTED_STATE = { on: { selected: true }, off: { selected: false } } as const

export function TreeSelectorEntrySheet({
  path, intensity, context, contextOther, contextOtherOpen, notes, config, texts, saving,
  onBack, onChangeIntensity, onToggleContext, onToggleContextOther, onChangeContextOther,
  onChangeNotes, onCancel, onSave,
}: TreeSelectorEntrySheetProps) {
  const accentColor = resolveAccentColor(path)
  const breadcrumb = buildBreadcrumb(path)
  const tintStyle = path.length > 0 ? { backgroundColor: accentColor + '08' } : null

  return (
    <KeyboardAvoidingView
      style={[styles.container, tintStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <TreeSelectorHeader
        onBack={onBack}
        showProgress={false}
        accentColor={accentColor}
        breadcrumb={breadcrumb}
        progress={0}
        backLabel={texts.back}
      />
      <ScrollView contentContainerStyle={styles.selectionContent} keyboardShouldPersistTaps="handled">
        {texts.entryTitle ? <Text style={styles.stepTitle}>{texts.entryTitle}</Text> : null}

        {config.enableIntensity ? (
          <View style={styles.sheetSection} testID="intensity-section">
            <Text style={styles.sheetSectionLabel}>{texts.intensityTitle}</Text>
            <View style={styles.intensityRow}>
              {config.intensityValues.map(v => {
                const isActive = intensity === v
                return (
                  <Pressable
                    key={v}
                    // Re-taper le cran actif le désélectionne : le champ reste facultatif
                    // même après une première touche.
                    onPress={() => onChangeIntensity(isActive ? null : v)}
                    style={[styles.intensityBtn, isActive ? styles.intensityBtnActive : null]}
                    accessibilityRole="button"
                    accessibilityLabel={String(v)}
                    accessibilityState={SELECTED_STATE[isActive ? 'on' : 'off']}
                    testID={`intensity-btn-${v}`}
                  >
                    <Text style={styles.intensityBtnText}>{v}</Text>
                  </Pressable>
                )
              })}
            </View>
            <View style={styles.intensityAnchors}>
              <Text style={styles.intensityAnchor}>{texts.intensityAnchorMin}</Text>
              <Text style={styles.intensityAnchor}>{texts.intensityAnchorMax}</Text>
            </View>
          </View>
        ) : null}

        {config.enableContext ? (
          <View style={styles.sheetSection} testID="context-section">
            <Text style={styles.sheetSectionLabel}>{texts.contextTitle}</Text>
            <View style={styles.chipsWrap} testID="context-chips">
              {config.contextOptions.map(opt => {
                const isActive = context.includes(opt.code)
                return (
                  <Chip
                    key={opt.code}
                    label={opt.label}
                    selected={isActive}
                    color={colors.primaryDark}
                    onPress={() => onToggleContext(opt.code)}
                    testID={`context-${opt.code}`}
                    icon={
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={16}
                        color={isActive ? colors.primaryDark : colors.textMuted}
                      />
                    }
                  />
                )
              })}
              <Chip
                label={texts.contextOtherBtn}
                selected={contextOtherOpen}
                color={colors.primaryDark}
                onPress={onToggleContextOther}
                testID="context-other"
                icon={
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={contextOtherOpen ? colors.primaryDark : colors.textMuted}
                  />
                }
              />
            </View>
            {contextOtherOpen ? (
              <TextInput
                style={styles.otherInput}
                placeholder={texts.contextOtherPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={contextOther}
                onChangeText={onChangeContextOther}
                accessibilityLabel={texts.contextOtherPlaceholder}
                testID="context-other-input"
              />
            ) : null}
          </View>
        ) : null}

        {config.enableNotes ? (
          <View style={styles.sheetSection} testID="notes-section">
            <Text style={styles.sheetSectionLabel}>{texts.notesTitle}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={texts.notesPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={onChangeNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel={texts.notesTitle}
              testID="notes-input"
            />
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.cancelBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={texts.cancel}
            testID="cancel-entry"
          >
            <Text style={styles.cancelBtnText}>{texts.cancel}</Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, saving ? styles.btnDisabled : null]}
            onPress={onSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={texts.saveBtn}
            testID="save-entry"
          >
            <Text style={styles.saveBtnText}>{saving ? '…' : texts.saveBtn}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
