import React, { useCallback, useMemo, useRef } from 'react'
import {
  View, Text, PanResponder,
  type GestureResponderEvent, type LayoutChangeEvent,
  type AccessibilityActionEvent, type AccessibilityActionInfo,
} from 'react-native'
import { styles } from './Slider.styles'
import { positionRatio, valueFromRatio, ratioFromValue, stepValue } from './sliderMath'
import type { SliderProps } from './Slider.types'

const A11Y_ACTIONS: AccessibilityActionInfo[] = [{ name: 'increment' }, { name: 'decrement' }]

// Curseur continu (glissement / tap) sur une plage [min,max] alignée sur `step`.
// `value = null` → piste vide sans thumb : rien n'est pré-sélectionné tant que le
// patient n'a pas interagi (pas de valeur d'ancrage — MDR 2017/745). Le
// remplissage et le thumb sont positionnés par flexbox (flex: ratio), sans mesure
// de largeur au rendu ; seule l'interaction lit la largeur mesurée (onLayout).
export const Slider = React.memo(function Slider({
  value, min, max, step = 1, color, label = '', unit, showEndLabels = false,
  testID, onChange,
}: SliderProps) {
  const widthRef = useRef(0)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width
  }, [])

  const panResponder = useMemo(() => {
    const emit = (e: GestureResponderEvent) => {
      const ratio = positionRatio(e.nativeEvent.locationX, widthRef.current)
      onChange(valueFromRatio(ratio, min, max, step))
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: emit,
      onPanResponderMove: emit,
    })
  }, [min, max, step, onChange])

  const handleA11yAction = useCallback((e: AccessibilityActionEvent) => {
    const delta = e.nativeEvent.actionName === 'increment' ? 1 : -1
    onChange(stepValue(value, delta, min, max, step))
  }, [value, min, max, step, onChange])

  const ratio = value != null ? ratioFromValue(value, min, max) : 0
  const valueText = value != null ? `${value}${unit != null && unit !== '' ? ` ${unit}` : ''}` : ''
  const valueTestId = testID != null ? `${testID}-value` : undefined
  const fillTestId = testID != null ? `${testID}-fill` : undefined
  const trackTestId = testID != null ? `${testID}-track` : undefined

  return (
    <View style={styles.container} testID={testID}>
      {(label !== '' || value != null) && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {value != null ? (
            <Text style={[styles.value, { color }]} testID={valueTestId}>{valueText}</Text>
          ) : null}
        </View>
      )}

      <View
        style={styles.track}
        testID={trackTestId}
        onLayout={handleLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value ?? undefined }}
        accessibilityActions={A11Y_ACTIONS}
        onAccessibilityAction={handleA11yAction}
        {...panResponder.panHandlers}
      >
        <View style={styles.bar} pointerEvents="none">
          <View style={[styles.fill, { flex: ratio, backgroundColor: color }]} testID={fillTestId}>
            {value != null ? <View style={[styles.thumb, { backgroundColor: color }]} /> : null}
          </View>
          <View style={[styles.empty, { flex: 1 - ratio }]} />
        </View>
      </View>

      {showEndLabels ? (
        <View style={styles.endLabels}>
          <Text style={styles.endLabel}>{min}</Text>
          <Text style={styles.endLabel}>{max}</Text>
        </View>
      ) : null}
    </View>
  )
})
