import { memo, useCallback, useEffect, useState } from 'react'
import { Text } from 'react-native'
import { Sheet } from '@ui/Sheet'
import { Stepper } from '@ui/Stepper'
import { Button } from '@ui/Button'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

/** Bornes de `breathing_settings.weekly_goal_sessions` (check en base : 1 à 14). */
export const GOAL_MIN = 1
export const GOAL_MAX = 14

export interface GoalSheetProps {
  visible: boolean
  /** Objectif courant, en sessions par semaine. */
  value: number
  onClose: () => void
  onSave: (goal: number) => void
  lbl: LabelFn
  /** `common.close` et `common.save`, résolus par le layout. */
  closeLabel: string
  saveLabel: string
}

/**
 * Feuille « Ajuster mon objectif ». L'objectif est en **sessions par semaine**,
 * jamais en minutes : c'est la régularité qui est suivie, pas un volume.
 *
 * Il est proposé en séance et reste librement ajustable par le patient : le texte
 * le dit explicitement, sans jargon de prescription.
 */
export const GoalSheet = memo(function GoalSheet({
  visible, value, onClose, onSave, lbl, closeLabel, saveLabel,
}: GoalSheetProps) {
  const [goal, setGoal] = useState(value)

  // La feuille se rouvre toujours sur l'objectif enregistré : une modification
  // abandonnée (fermeture par le voile) ne doit pas survivre à la réouverture.
  useEffect(() => {
    if (visible) setGoal(value)
  }, [visible, value])

  const handleSave = useCallback(() => onSave(goal), [onSave, goal])

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={closeLabel}
      title={lbl('goal_sheet_title')}
      testID="breathing-goal-sheet"
    >
      <Stepper
        value={goal}
        min={GOAL_MIN}
        max={GOAL_MAX}
        onChange={setGoal}
        unit={lbl('goal_unit')}
        decrementLabel={lbl('goal_decrement')}
        incrementLabel={lbl('goal_increment')}
        testID="breathing-goal-stepper"
      />
      <Text style={hubStyles.sheetNote}>{lbl('goal_sheet_note')}</Text>
      <Button
        label={saveLabel}
        onPress={handleSave}
        accessibilityLabel={saveLabel}
        testID="breathing-goal-save"
      />
    </Sheet>
  )
})
