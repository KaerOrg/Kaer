import React, { useCallback, useMemo } from 'react'
import { Pressable, Text, type ViewStyle } from 'react-native'
import { styles } from './SegmentedControl.styles'

export interface SegmentButtonProps<T extends string = string> {
  value: T
  label: string
  active: boolean
  /** Habillage de base du segment (`trackSegment` ou `pillSegment`). */
  segmentStyle: ViewStyle
  /** Couleur de fond appliquée uniquement quand le segment est actif. */
  accentColor: string
  onSelect: (value: T) => void
  testID?: string
}

/** Un segment de `SegmentedControl`. Mémoïsé : callback figé via `useCallback`. */
function SegmentButtonComponent<T extends string>({
  value, label, active, segmentStyle, accentColor, onSelect, testID,
}: SegmentButtonProps<T>) {
  const handlePress = useCallback(() => onSelect(value), [value, onSelect])
  const style = useMemo(
    () => [segmentStyle, active ? { backgroundColor: accentColor, borderColor: accentColor } : null],
    [segmentStyle, active, accentColor],
  )

  return (
    <Pressable
      style={style}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={testID}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  )
}

// `memo` efface la généricité ; le cast la restaure sans recourir à `any`/`unknown`.
export const SegmentButton = React.memo(SegmentButtonComponent) as typeof SegmentButtonComponent
