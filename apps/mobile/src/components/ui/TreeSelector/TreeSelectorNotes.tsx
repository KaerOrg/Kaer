// Mode « notes » du primitive TreeSelector : récapitulatif de la sélection +
// zone de texte libre, puis actions Annuler / Enregistrer.

import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccentColor, buildBreadcrumb } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'
import { styles } from './styles'

interface TreeSelectorNotesProps {
  path: TreeSelectorNode[]
  notes: string
  intensity: number
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  saving: boolean
  onBack: () => void
  onChangeNotes: (v: string) => void
  onCancel: () => void
  onSave: () => void
}

export function TreeSelectorNotes({
  path, notes, intensity, config, texts, saving, onBack, onChangeNotes, onCancel, onSave,
}: TreeSelectorNotesProps) {
  const accentColor = resolveAccentColor(path)
  const breadcrumb = buildBreadcrumb(path)
  const tintStyle = path.length > 0 ? { backgroundColor: accentColor + '08' } : null
  const summary = path.map(n => n.label).filter(Boolean).join(' — ')

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
        {texts.notesTitle ? <Text style={styles.stepTitle}>{texts.notesTitle}</Text> : null}
        {texts.notesHint ? <Text style={styles.stepHint}>{texts.notesHint}</Text> : null}

        {summary ? (
          <View style={[styles.summaryCard, { borderLeftColor: accentColor }]} testID="summary-card">
            <Text style={[styles.summaryPrimary, { color: accentColor }]}>{summary}</Text>
            {config.enableIntensity ? (
              <Text style={styles.summaryMeta}>{intensity}/{config.intensityMax}</Text>
            ) : null}
          </View>
        ) : null}

        <TextInput
          style={styles.notesInput}
          placeholder={texts.notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={onChangeNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel={texts.notesPlaceholder}
          testID="notes-input"
        />

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
            style={[styles.saveBtn, { backgroundColor: accentColor }, saving && styles.btnDisabled]}
            onPress={onSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={texts.saveBtn}
            testID="save-entry"
          >
            <Text style={styles.saveBtnText}>{saving ? '…' : texts.saveBtn}</Text>
            {!saving && <MaterialCommunityIcons name="check" size={20} color={colors.white} />}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
