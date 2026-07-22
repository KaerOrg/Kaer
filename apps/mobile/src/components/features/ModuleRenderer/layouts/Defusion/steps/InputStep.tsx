import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import { colors, spacing, radius } from '@theme'

export interface InputStepProps {
  value: string
  onChange: (value: string) => void
  onContinue: () => void
  /** Répétition de mot = une ligne (max 40) ; distanciation = pensée multiligne. */
  multiline: boolean
  maxLength: number
  title: string
  placeholder: string
  privacyNote: string
  continueLabel: string
  accent: string
}

/**
 * Étape A — saisie du mot (répétition) ou de la pensée (distanciation). Le CTA est
 * désactivé tant que le champ est vide. La mention « visible par vous et votre
 * praticien » est explicite : le mot est synchronisé côté praticien, jamais présenté
 * comme restant local.
 */
export function InputStep({
  value, onChange, onContinue, multiline, maxLength,
  title, placeholder, privacyNote, continueLabel, accent,
}: InputStepProps) {
  const disabled = value.trim() === ''
  const accentBtnStyle = useMemo(() => ({ backgroundColor: accent }), [accent])

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{title}</Text>

      <InputField
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus
        containerStyle={styles.field}
        style={multiline ? styles.multiline : undefined}
      />

      <View style={styles.privacyRow}>
        <MaterialCommunityIcons name="lock-outline" size={14} color={colors.textMuted} />
        <Text style={styles.privacy}>{privacyNote}</Text>
      </View>

      <Button
        variant="primary"
        style={accentBtnStyle}
        label={continueLabel}
        disabled={disabled}
        onPress={onContinue}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, lineHeight: 28 },
  field: { marginBottom: 0 },
  multiline: { minHeight: 96, textAlignVertical: 'top', borderRadius: radius.md },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  privacy: { flex: 1, flexShrink: 1, fontSize: 12, color: colors.textMuted },
})
