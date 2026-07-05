import React, { useCallback, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { Button } from '@ui/Button'
import { RatingSelector } from '@ui/RatingSelector'
import type { ActivityRecord } from '../../../../../lib/database'
import type { ActivityLogConfig } from './activityLogConfig'
import type { LabelFn } from './types'
import { alStyles } from './styles'

export interface CompletionSheetProps {
  record: ActivityRecord
  config: ActivityLogConfig
  lbl: LabelFn
  /** Enregistre la complétion avec les ressentis choisis (null = non renseigné). */
  onSave: (pleasure: number | null, mastery: number | null) => void
  /** Marque réalisée sans noter (« Passer »). */
  onSkip: () => void
  /** Referme sans rien changer (backdrop) : l'activité reste planifiée. */
  onCancel: () => void
}

/**
 * Feuille d'évaluation ouverte au moment où le patient coche une activité
 * réalisée : « C'était comment ? » + P/M ressentis. C'est LE moment de la
 * notation (jamais avant l'action).
 * « Passer » marque réalisée sans noter : non renseigné est un état légitime.
 * `ui/ActionSheet` ne convient pas (contrat liste d'options, sans contenu
 * libre) : feuille dédiée sur le même motif Modal bas d'écran.
 * Affichage brut, aucune interprétation (MDR 2017/745).
 */
export function CompletionSheet({ record, config, lbl, onSave, onSkip, onCancel }: CompletionSheetProps) {
  const [pleasure, setPleasure] = useState<number | null>(null)
  const [mastery, setMastery] = useState<number | null>(null)

  const handlePleasurePress = useCallback((value: number) => {
    setPleasure(prev => (prev === value ? null : value))
  }, [])
  const handleMasteryPress = useCallback((value: number) => {
    setMastery(prev => (prev === value ? null : value))
  }, [])
  const handleSave = useCallback(() => onSave(pleasure, mastery), [onSave, pleasure, mastery])

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={alStyles.sheetBackdrop}>
        <Pressable style={alStyles.sheetBackdropTap} onPress={onCancel} accessibilityLabel={lbl('back_label')} />
        <View style={alStyles.sheet} testID="completion-sheet">
          <Text style={alStyles.sheetTitle}>{lbl('completion_title')}</Text>
          <Text style={alStyles.sheetActivity}>{record.label}</Text>
          <RatingSelector
            label={lbl('pleasure_label')}
            sublabel={lbl('pleasure_sublabel')}
            value={pleasure}
            steps={config.pleasureSteps}
            color={config.pleasureColor}
            variant="track"
            showEndLabels
            testIdPrefix="completion-pleasure"
            onPress={handlePleasurePress}
          />
          <View style={alStyles.cardDivider} />
          <RatingSelector
            label={lbl('mastery_label')}
            sublabel={lbl('mastery_sublabel')}
            value={mastery}
            steps={config.masterySteps}
            color={config.masteryColor}
            variant="track"
            showEndLabels
            testIdPrefix="completion-mastery"
            onPress={handleMasteryPress}
          />
          <Button
            label={lbl('save_label')}
            onPress={handleSave}
            accessibilityLabel={lbl('save_label')}
            testID="completion-save"
          />
          <Button
            variant="ghost"
            size="sm"
            label={lbl('completion_skip_label')}
            onPress={onSkip}
            accessibilityLabel={lbl('completion_skip_label')}
            testID="completion-skip"
          />
        </View>
      </View>
    </Modal>
  )
}
