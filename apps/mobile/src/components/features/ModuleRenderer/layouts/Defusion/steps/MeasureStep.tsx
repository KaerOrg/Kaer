import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Button } from '@ui/Button'
import { Slider } from '@ui/Slider'
import { colors, spacing } from '@theme'
import type { DefusionMeasure } from '../defusionReaderMachine'

export interface MeasureStepProps {
  title: string
  discomfortLabel: string
  beliefLabel: string
  continueLabel: string
  skipLabel: string
  accent: string
  /** `null` = étape passée (mesure passée par le patient). */
  onSubmit: (measure: DefusionMeasure | null) => void
}

const SCALE_MIN = 0
const SCALE_MAX = 10

/**
 * Étape mesure (avant / après) : deux curseurs 0 à 10 séparés (inconfort,
 * conviction), VIDES au départ (`value = null`, aucune valeur d'ancrage — MDR).
 * « Continuer » n'est actif que si les deux curseurs sont renseignés ; sinon le
 * patient « Passe cette étape » (les deux dimensions deviennent null ENSEMBLE :
 * jamais une mesure partielle).
 */
export function MeasureStep({
  title, discomfortLabel, beliefLabel, continueLabel, skipLabel, accent, onSubmit,
}: MeasureStepProps) {
  const [discomfort, setDiscomfort] = useState<number | null>(null)
  const [belief, setBelief] = useState<number | null>(null)

  const canContinue = discomfort !== null && belief !== null
  const accentBtnStyle = useMemo(() => ({ backgroundColor: accent }), [accent])

  const handleContinue = useCallback(() => {
    if (discomfort === null || belief === null) return
    onSubmit({ discomfort, belief })
  }, [discomfort, belief, onSubmit])

  const handleSkip = useCallback(() => onSubmit(null), [onSubmit])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.sliderBlock}>
        <Text style={styles.label}>{discomfortLabel}</Text>
        <Slider
          value={discomfort}
          min={SCALE_MIN}
          max={SCALE_MAX}
          color={accent}
          label={discomfortLabel}
          showEndLabels
          showHeader={false}
          onChange={setDiscomfort}
          testID="measure-discomfort"
        />
      </View>

      <View style={styles.sliderBlock}>
        <Text style={styles.label}>{beliefLabel}</Text>
        <Slider
          value={belief}
          min={SCALE_MIN}
          max={SCALE_MAX}
          color={accent}
          label={beliefLabel}
          showEndLabels
          showHeader={false}
          onChange={setBelief}
          testID="measure-belief"
        />
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          style={accentBtnStyle}
          label={continueLabel}
          disabled={!canContinue}
          onPress={handleContinue}
        />
        <Button variant="ghost" label={skipLabel} onPress={handleSkip} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, lineHeight: 28 },
  sliderBlock: { gap: spacing.sm },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
})
