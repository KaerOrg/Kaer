import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { RatingSelector } from '@ui/RatingSelector'
import { etStyles } from './styles'

export interface StepFormViewProps {
  initialLabel: string
  initialTarget: number
  sudsSteps: number[]
  isNew: boolean
  lbl: (k: string, opts?: Record<string, string | number>) => string
  tCommon: (k: string) => string
  onBack: () => void
  onSave: (label: string, target: number) => void
}

/** Ajout / édition d'une marche de l'échelle (libellé + SUDS cible estimé). */
export function StepFormView({
  initialLabel, initialTarget, sudsSteps, isNew, lbl, tCommon, onBack, onSave,
}: StepFormViewProps) {
  const [label, setLabel] = useState(initialLabel)
  const [target, setTarget] = useState(initialTarget)

  const canSave = label.trim().length > 0

  return (
    <View style={etStyles.container} testID="exposure-step-form">
      <View style={etStyles.entryHeaderBar}>
        <Pressable onPress={onBack} style={etStyles.backBtn} accessibilityLabel={tCommon('common.back')} testID="step-form-back">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={etStyles.headerTitle}>{lbl(isNew ? 'add_step' : 'edit_step')}</Text>
      </View>

      <ScrollView contentContainerStyle={etStyles.entryContent} keyboardShouldPersistTaps="handled">
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('step_label')}</Text>
          <TextInput
            style={etStyles.stepInput}
            value={label}
            onChangeText={setLabel}
            placeholder={lbl('step_label_placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            testID="step-label-input"
          />
        </View>

        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('step_target_label')}</Text>
          <Text style={etStyles.stratHint}>{lbl('step_target_hint')}</Text>
          <View style={etStyles.card}>
            <RatingSelector
              value={target}
              steps={sudsSteps}
              color={colors.primary}
              label={lbl('step_target_label')}
              variant="track"
              showHeader
              showEndLabels
              onPress={setTarget}
            />
            <Text style={etStyles.sudsHeaderHint}>{lbl('scale_hint')}</Text>
          </View>
        </View>

        <Pressable
          style={[etStyles.saveBtn, !canSave && etStyles.btnDisabled]}
          onPress={() => { if (canSave) onSave(label.trim(), target) }}
          disabled={!canSave}
          accessibilityRole="button"
          testID="step-save"
        >
          <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
          <Text style={etStyles.saveBtnText}>{tCommon('common.save')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
