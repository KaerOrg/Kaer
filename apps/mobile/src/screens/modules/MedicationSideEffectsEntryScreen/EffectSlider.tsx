import React, { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'
import { Slider } from '@ui/Slider'

// ─── Curseur d'intensité d'un effet indésirable (0..10) ──────────────────────
//
// Une carte par effet suivi : en-tête (pastille de couleur + libellé + valeur),
// curseur continu (primitive `ui/Slider`, aucun « pip » ad hoc), ancres bas/haut.
// `value = null` → piste vide, aucun thumb : l'effet reste « non renseigné » tant
// que le patient n'a pas glissé le curseur (pas d'ancrage — MDR 2017/745).
// Leaf mémoïsé à `onChange` stable (item de liste).

export interface EffectSliderProps {
  readonly effectKey: string
  readonly label: string
  readonly color: string
  readonly value: number | null
  readonly lowHint: string
  readonly highHint: string
  readonly onChange: (key: string, value: number) => void
}

export const EffectSlider = React.memo(function EffectSlider({
  effectKey, label, color, value, lowHint, highHint, onChange,
}: EffectSliderProps) {
  const handleChange = useCallback((v: number) => onChange(effectKey, v), [onChange, effectKey])

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
        {value !== null ? <Text style={[styles.value, { color }]}>{value}</Text> : null}
      </View>

      <Slider
        value={value}
        min={0}
        max={10}
        color={color}
        label={label}
        showHeader={false}
        onChange={handleChange}
        testID={`effect-${effectKey}`}
      />

      <View style={styles.hints}>
        <Text style={styles.hint}>{lowHint}</Text>
        <Text style={styles.hint}>{highHint}</Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  value: { fontSize: 20, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  hints: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontSize: 11, color: colors.textMuted },
})
