import { useState, useRef, useCallback } from 'react'
import { Modal, View, Text, TextInput, Pressable } from 'react-native'
import type { Medication, MedicationKind } from '@psytool/shared'
import { colors } from '../../../../../theme'
import { Button } from '../../../../ui/Button'
import { styles } from './styles'

// Absorbe le press sur la carte pour qu'il ne ferme pas la modale (backdrop).
const NOOP = () => {}

export interface MedicationDraft {
  name: string
  posology: string
  kind: MedicationKind
}

interface Props {
  visible: boolean
  initial: Medication | null
  labels: {
    title: string
    name: string
    posology: string
    kindMaintenance: string
    kindPrn: string
    save: string
    cancel: string
  }
  onCancel: () => void
  onSave: (draft: MedicationDraft) => void
}

// Modale de saisie/édition d'une molécule. `name` est contrôlé (conditionne le
// bouton Enregistrer) ; `posology` est non contrôlé (lue au submit uniquement).
export function MedicationEditorModal({ visible, initial, labels, onCancel, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<MedicationKind>(initial?.kind ?? 'maintenance')
  const posologyRef = useRef(initial?.posology ?? '')

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (trimmed.length === 0) return
    onSave({ name: trimmed, posology: posologyRef.current.trim(), kind })
  }, [name, kind, onSave])

  const canSave = name.trim().length > 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={NOOP}>
          <Text style={styles.modalTitle}>{labels.title}</Text>

          <Text style={styles.sectionLabel}>{labels.name}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textMuted}
            autoFocus
            testID="med-name-input"
          />

          <Text style={styles.sectionLabel}>{labels.posology}</Text>
          <TextInput
            style={styles.input}
            defaultValue={posologyRef.current}
            onChangeText={v => { posologyRef.current = v }}
            placeholderTextColor={colors.textMuted}
            testID="med-posology-input"
          />

          <View style={styles.kindRow}>
            <Pressable
              style={[styles.kindBtn, kind === 'maintenance' && styles.kindBtnSelected]}
              onPress={() => setKind('maintenance')}
              accessibilityRole="radio"
              accessibilityState={{ checked: kind === 'maintenance' }}
            >
              <Text style={[styles.kindBtnText, kind === 'maintenance' && styles.kindBtnTextSelected]}>
                {labels.kindMaintenance}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.kindBtn, kind === 'prn' && styles.kindBtnSelected]}
              onPress={() => setKind('prn')}
              accessibilityRole="radio"
              accessibilityState={{ checked: kind === 'prn' }}
            >
              <Text style={[styles.kindBtnText, kind === 'prn' && styles.kindBtnTextSelected]}>
                {labels.kindPrn}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalActions}>
            <Button label={labels.cancel} onPress={onCancel} variant="secondary" style={styles.modalAction} />
            <Button
              label={labels.save}
              onPress={handleSave}
              disabled={!canSave}
              style={styles.modalAction}
              testID="med-save-button"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
