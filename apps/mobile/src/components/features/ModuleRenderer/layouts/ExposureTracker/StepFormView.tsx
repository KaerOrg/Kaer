import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { SudsField } from './SudsField'
import { etStyles } from './styles'

export interface StepFormViewProps {
  initialLabel: string
  initialTarget: number
  sudsSteps: number[]
  sudsMax: number
  /** Teinte pastel de la saisie de difficulté (teal de la config). */
  color: string
  isNew: boolean
  lbl: (k: string, opts?: Record<string, string | number>) => string
  tCommon: (k: string) => string
  onBack: () => void
  onSave: (label: string, target: number) => void
}

/** Ajout / édition d'une marche de l'échelle (libellé + difficulté initiale estimée). */
export function StepFormView({
  initialLabel, initialTarget, sudsSteps, sudsMax, color, isNew, lbl, tCommon, onBack, onSave,
}: StepFormViewProps) {
  const [label, setLabel] = useState(initialLabel)
  const [target, setTarget] = useState(initialTarget)

  const canSave = label.trim().length > 0

  return (
    <View style={etStyles.container} testID="exposure-step-form">
      <View style={etStyles.entryHeaderBar}>
        <Button
          variant="ghost"
          onPress={onBack}
          accessibilityLabel={tCommon('common.back')}
          iconLeft={<MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />}
          testID="step-form-back"
        />
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
          <Text style={etStyles.sectionLabel}>{lbl('step_target_suds_label')}</Text>
          <Text style={etStyles.stratHint}>{lbl('step_target_hint')}</Text>
          <SudsField
            label={lbl('step_target_suds_short')}
            value={target}
            max={sudsMax}
            color={color}
            sudsSteps={sudsSteps}
            legend={lbl('scale_hint')}
            onChange={(v) => setTarget(v ?? sudsSteps[0] ?? 0)}
            testID="step-target-field"
          />
        </View>

        <Button
          variant="primary"
          label={tCommon('common.save')}
          iconLeft={<MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />}
          disabled={!canSave}
          onPress={() => { if (canSave) onSave(label.trim(), target) }}
          style={etStyles.ctaBtn}
          testID="step-save"
        />
      </ScrollView>
    </View>
  )
}
