import { memo, useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { colors } from '@theme'
import { Chip } from '@ui/Chip'
import { generateId } from '../../../../../lib/database'
import { fetchCustomChips, saveCustomChip } from '@services/customChipService'
import { styles } from './styles'
import type { ChoiceOption } from './ColumnChoiceField'

const CUSTOM_PREFIX = 'custom:'

export interface ColumnChipsFieldProps {
  fieldKey: string
  moduleId: string
  /** Groupe de chips personnelles (lieu, émotion, stratégie…) — clé de persistance. */
  groupKey: string
  label: string
  options: ChoiceOption[]
  allowCustom: boolean
  accent: string
  /** Codes sélectionnés (options + `custom:<label>`). */
  value: string[]
  addLabel: string
  onChange: (codes: string[]) => void
}

/**
 * Champ de chips MULTI-SÉLECTION générique (`column_chips_field`). Le code stocké
 * est stable (jamais le libellé — l'agrégation praticien en dépend). `allow_custom`
 * ouvre un champ « + Autre… » : le mot devient une chip sélectionnée ET une chip
 * personnelle réutilisable (persistée par groupe, affichée en tête ensuite).
 * L'accent code l'identité du groupe, jamais une gravité (MDR).
 */
export const ColumnChipsField = memo(function ColumnChipsField({
  fieldKey, moduleId, groupKey, label, options, allowCustom, accent, value, addLabel, onChange,
}: ColumnChipsFieldProps) {
  // Chips personnelles déjà créées pour ce groupe (affichées en tête).
  const [customLabels, setCustomLabels] = useState<string[]>([])
  const [showInput, setShowInput] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    let alive = true
    fetchCustomChips(moduleId, groupKey)
      .then(chips => { if (alive) setCustomLabels(chips.map(c => c.label)) })
      .catch(() => { /* pas de chips perso — liste vide */ })
    return () => { alive = false }
  }, [moduleId, groupKey])

  const toggle = useCallback(
    (code: string) => {
      onChange(value.includes(code) ? value.filter(c => c !== code) : [...value, code])
    },
    [onChange, value],
  )

  const submitCustom = useCallback(() => {
    const trimmed = draft.trim()
    setShowInput(false)
    setDraft('')
    if (trimmed === '') return
    const code = `${CUSTOM_PREFIX}${trimmed}`
    if (!customLabels.includes(trimmed)) {
      setCustomLabels(prev => [trimmed, ...prev])
      void saveCustomChip({ id: generateId(), module_id: moduleId, group_key: groupKey, label: trimmed })
    }
    if (!value.includes(code)) onChange([...value, code])
  }, [draft, customLabels, moduleId, groupKey, value, onChange])

  const openInput = useCallback(() => setShowInput(true), [])

  return (
    <View testID={`chips-${fieldKey}`}>
      {label ? <Text style={styles.chipsGroupLabel}>{label}</Text> : null}
      <View style={styles.chipsRow}>
        {customLabels.map(lbl => {
          const code = `${CUSTOM_PREFIX}${lbl}`
          return (
            <Chip
              key={code}
              label={lbl}
              color={accent}
              selected={value.includes(code)}
              onPress={() => toggle(code)}
              testID={`chip-${fieldKey}-${code}`}
            />
          )
        })}
        {options.map(o => (
          <Chip
            key={o.code}
            label={o.label}
            color={accent}
            selected={value.includes(o.code)}
            onPress={() => toggle(o.code)}
            testID={`chip-${fieldKey}-${o.code}`}
          />
        ))}
        {allowCustom && !showInput ? (
          <Chip label={addLabel} color={accent} onPress={openInput} testID={`chip-add-${fieldKey}`} />
        ) : null}
      </View>

      {showInput ? (
        <TextInput
          style={[styles.textInput, { borderColor: accent }]}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submitCustom}
          onBlur={submitCustom}
          autoFocus
          placeholder={addLabel}
          placeholderTextColor={colors.textMuted}
          testID={`chip-input-${fieldKey}`}
        />
      ) : null}
    </View>
  )
})
