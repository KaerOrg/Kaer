import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { Sheet } from '@ui/Sheet'
import { Toggle } from '@ui/Toggle'
import { Button } from '@ui/Button'
import { SegmentedControl } from '@ui/SegmentedControl'
import type { BreathingAmbientSound, BreathingTechnique } from '@services/breathingService'
import { AmbientChip } from './AmbientChip'
import { resolvePreferredDuration } from './preferredDuration'
import { hubStyles } from './hubStyles'
import type { LabelFn } from './types'

/** Les réglages d'accompagnement que la feuille manipule et remonte au hub. */
export interface PreparationDraft {
  durationMin: number
  haptics: boolean
  breathSound: boolean
  ambientSound: boolean
  ambientSoundKey: BreathingAmbientSound
}

export interface PreparationSheetProps {
  visible: boolean
  /** La technique sur le point d'être pratiquée. */
  technique: BreathingTechnique
  /** Réglages enregistrés, sur lesquels la feuille se (r)ouvre. */
  value: PreparationDraft
  /** Durées proposées (minutes), lues en base. */
  durations: readonly number[]
  /** Ambiances proposées, lues en base. */
  ambientSounds: readonly BreathingAmbientSound[]
  onClose: () => void
  /** Démarre la session avec ces réglages, que l'appelant persiste. */
  onStart: (draft: PreparationDraft) => void
  lbl: LabelFn
  /** `common.close`, résolu par le layout. */
  closeLabel: string
}

/**
 * Feuille de préparation, ouverte avant chaque session. Elle donne le temps de
 * s'installer, et laisse choisir la durée et l'accompagnement.
 *
 * Les trois accompagnements sont **cumulables** : vibration, souffle et ambiance
 * peuvent être actifs ensemble. Le souffle guidé est un enregistrement de
 * respiration calé sur les phases, **jamais une voix parlée**.
 *
 * Les réglages sont mémorisés d'une session à l'autre : la feuille se rouvre sur
 * les derniers choix, et revenir en arrière ne démarre rien.
 */
export const PreparationSheet = memo(function PreparationSheet({
  visible, technique, value, durations, ambientSounds, onClose, onStart, lbl, closeLabel,
}: PreparationSheetProps) {
  const [draft, setDraft] = useState<PreparationDraft>(value)

  // La feuille se rouvre toujours sur les réglages enregistrés : un choix abandonné
  // (fermeture par le voile) ne survit pas à la réouverture. La durée est recalée
  // sur les options proposées, pour ne jamais afficher un segmenté sans sélection.
  useEffect(() => {
    if (!visible) return
    setDraft({
      ...value,
      durationMin: resolvePreferredDuration(value.durationMin, durations) ?? value.durationMin,
    })
  }, [visible, value, durations])

  const durationOptions = useMemo(
    () => durations.map(min => ({ value: String(min), label: lbl('prep_duration_option', { min }) })),
    [durations, lbl],
  )

  const handleDuration = useCallback(
    (next: string) => setDraft(prev => ({ ...prev, durationMin: Number(next) })),
    [],
  )
  const handleHaptics = useCallback(
    (haptics: boolean) => setDraft(prev => ({ ...prev, haptics })),
    [],
  )
  const handleBreathSound = useCallback(
    (breathSound: boolean) => setDraft(prev => ({ ...prev, breathSound })),
    [],
  )
  const handleAmbientSound = useCallback(
    (ambientSound: boolean) => setDraft(prev => ({ ...prev, ambientSound })),
    [],
  )
  const handleAmbientKey = useCallback(
    (ambientSoundKey: BreathingAmbientSound) => setDraft(prev => ({ ...prev, ambientSoundKey })),
    [],
  )
  const handleStart = useCallback(() => onStart(draft), [onStart, draft])

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={closeLabel}
      title={lbl(`${technique.key}_name`)}
      subtitle={lbl('prep_posture')}
      scrollable
      testID="breathing-prep-sheet"
    >
      <View>
        <Text style={hubStyles.sheetLabel}>{lbl('prep_duration_label')}</Text>
        <SegmentedControl
          options={durationOptions}
          value={String(draft.durationMin)}
          onChange={handleDuration}
          accentColor={technique.color}
          accessibilityLabel={lbl('prep_duration_label')}
          style={hubStyles.prepSegments}
          testID="breathing-prep-duration"
        />
      </View>

      <Toggle
        value={draft.haptics}
        onValueChange={handleHaptics}
        label={lbl('prep_haptics_label')}
        sublabel={lbl('prep_haptics_sublabel')}
        color={technique.color}
        testID="breathing-prep-haptics"
      />
      <Toggle
        value={draft.breathSound}
        onValueChange={handleBreathSound}
        label={lbl('prep_breath_label')}
        sublabel={lbl('prep_breath_sublabel')}
        color={technique.color}
        testID="breathing-prep-breath"
      />
      <Toggle
        value={draft.ambientSound}
        onValueChange={handleAmbientSound}
        label={lbl('prep_ambient_label')}
        sublabel={lbl('prep_ambient_sublabel')}
        color={technique.color}
        testID="breathing-prep-ambient"
      />

      {draft.ambientSound ? (
        <View style={hubStyles.ambientChips} testID="breathing-prep-ambient-chips">
          {ambientSounds.map(key => (
            <AmbientChip
              key={key}
              soundKey={key}
              label={lbl(`ambient_${key}`)}
              color={technique.color}
              selected={draft.ambientSoundKey === key}
              onSelect={handleAmbientKey}
            />
          ))}
        </View>
      ) : null}

      <Button
        label={lbl('prep_start_btn')}
        onPress={handleStart}
        accessibilityLabel={lbl('prep_start_btn')}
        testID="breathing-prep-start"
      />
      <Text style={hubStyles.sheetNote}>{lbl('prep_stop_anytime')}</Text>
    </Sheet>
  )
})
