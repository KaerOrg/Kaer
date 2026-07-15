import React, { useEffect, useState, type ComponentProps } from 'react'
import { View, Text, TextInput, Modal, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors, spacing, radius } from '@theme'
import { dateToIso } from '@kaer/shared'
import { Chip } from '@ui/Chip'
import { Button } from '@ui/Button'
import type { MarkerType } from '../../../lib/database'
import { MARKER_TYPES, MARKER_TYPE_COLORS, MARKER_TYPE_ICONS } from '../../../lib/markerTheme'

// ─── Modale « Ajouter un repère » typé ───────────────────────────────────────
//
// Repère daté et typé (traitement / événement de vie / autre), posé sur les
// courbes. Sélecteur de date = calendrier direct (DateTimePicker), pas de simples
// chevrons. Chaque type porte sa couleur d'identité (Chip). Aucune interprétation
// clinique — le repère est un contexte brut (MDR).

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

export interface MarkerModalProps {
  readonly visible: boolean
  readonly onClose: () => void
  readonly onSave: (input: { label: string; type: MarkerType; date: string }) => void
  readonly title: string
  readonly labelPlaceholder: string
  readonly typeLabels: Record<MarkerType, string>
  readonly cancelLabel: string
  readonly saveLabel: string
  readonly locale: string
}

export const MarkerModal = React.memo(function MarkerModal({
  visible, onClose, onSave, title, labelPlaceholder,
  typeLabels, cancelLabel, saveLabel, locale,
}: MarkerModalProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<MarkerType>('treatment')
  const [date, setDate] = useState<Date>(() => new Date())

  // Réinitialise à chaque ouverture (pas de valeur résiduelle d'une saisie passée).
  useEffect(() => {
    if (visible) {
      setLabel('')
      setType('treatment')
      setDate(new Date())
    }
  }, [visible])

  const canSave = label.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({ label: label.trim(), type, date: dateToIso(date) })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>

          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder={labelPlaceholder}
            placeholderTextColor={colors.textMuted}
            maxLength={60}
            autoFocus
          />

          <View style={styles.typeRow}>
            {MARKER_TYPES.map(mt => (
              <Chip
                key={mt}
                label={typeLabels[mt]}
                selected={type === mt}
                color={MARKER_TYPE_COLORS[mt]}
                size="sm"
                icon={
                  <MaterialCommunityIcons
                    name={MARKER_TYPE_ICONS[mt] as IconName}
                    size={13}
                    color={type === mt ? MARKER_TYPE_COLORS[mt] : colors.textMuted}
                  />
                }
                onPress={() => setType(mt)}
              />
            ))}
          </View>

          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              maximumDate={new Date()}
              locale={locale}
              onChange={(_e, selected) => { if (selected != null) setDate(selected) }}
            />
          </View>

          <View style={styles.actions}>
            <Button label={cancelLabel} onPress={onClose} variant="secondary" style={styles.actionBtn} />
            <Button
              label={saveLabel}
              onPress={handleSave}
              variant="primary"
              disabled={!canSave}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  box: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg,
    width: '100%', maxWidth: 360, gap: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  pickerWrap: { alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },
})
