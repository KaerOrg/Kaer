import { memo, useCallback } from 'react'
import { Chip } from '@ui/Chip'
import type { BreathingAmbientSound } from '@services/breathingService'

export interface AmbientChipProps {
  /** Clé d'ambiance persistée dans `breathing_settings.ambient_sound_key`. */
  soundKey: BreathingAmbientSound
  label: string
  color: string
  selected: boolean
  /** Reçoit la clé : évite une lambda par puce dans le rendu du parent. */
  onSelect: (soundKey: BreathingAmbientSound) => void
}

/**
 * Une puce d'ambiance sonore. Choix exclusif : une seule ambiance à la fois, la
 * puce sélectionnée ne se désélectionne pas (il faut couper la bascule pour ça).
 */
export const AmbientChip = memo(function AmbientChip({
  soundKey, label, color, selected, onSelect,
}: AmbientChipProps) {
  const handlePress = useCallback(() => onSelect(soundKey), [onSelect, soundKey])

  return (
    <Chip
      label={label}
      color={color}
      selected={selected}
      onPress={handlePress}
      testID={`breathing-ambient-${soundKey}`}
    />
  )
})
