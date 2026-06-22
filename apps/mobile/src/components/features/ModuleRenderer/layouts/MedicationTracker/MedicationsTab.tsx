import { useState, useCallback } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { Medication } from '@kaer/shared'
import { colors } from '../../../../../theme'
import { generateId } from '../../../../../lib/database'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { MedicationEditorModal, type MedicationDraft } from './MedicationEditorModal'
import { styles } from './styles'

export interface MedicationsTabLabels {
  title: string
  empty: string
  add: string
  name: string
  posology: string
  kindMaintenance: string
  kindPrn: string
  save: string
  cancel: string
  editTitle: string
  addTitle: string
  deleteTitle: string
  deleteMessage: string
  deleteConfirm: string
}

interface Props {
  medications: Medication[]
  labels: MedicationsTabLabels
  kindLabel: (kind: Medication['kind']) => string
  onSave: (medications: Medication[]) => void
}

// Onglet « Mes médicaments » — liste co-éditée patient↔praticien. Le patient ajoute,
// modifie ou retire ses molécules (fond / si-besoin). Aucune interprétation : simple
// gestion d'une liste de traitement déclarée par le patient.
export function MedicationsTab({ medications, labels, kindLabel, onSave }: Props) {
  const { showConfirm } = useConfirmDialog()
  const [editing, setEditing] = useState<Medication | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openAdd = useCallback(() => { setEditing(null); setModalOpen(true) }, [])
  const openEdit = useCallback((med: Medication) => { setEditing(med); setModalOpen(true) }, [])
  const closeModal = useCallback(() => setModalOpen(false), [])

  const handleSave = useCallback((draft: MedicationDraft) => {
    const next = editing
      ? medications.map(m => (m.id === editing.id ? { ...m, ...draft } : m))
      : [...medications, { id: generateId(), ...draft }]
    onSave(next)
    setModalOpen(false)
  }, [editing, medications, onSave])

  const handleRemove = useCallback((med: Medication) => {
    showConfirm({
      title: labels.deleteTitle,
      message: labels.deleteMessage,
      confirmLabel: labels.deleteConfirm,
      destructive: true,
      onConfirm: () => onSave(medications.filter(m => m.id !== med.id)),
    })
  }, [showConfirm, labels, medications, onSave])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>{labels.title}</Text>

      {medications.length === 0 ? (
        <View style={styles.empty} testID="meds-empty">
          <MaterialCommunityIcons name="pill" size={32} color={colors.border} />
          <Text style={styles.emptyText}>{labels.empty}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {medications.map(med => (
            <View key={med.id} style={styles.medRow} testID={`med-${med.id}`}>
              <Pressable style={styles.medRowMain} onPress={() => openEdit(med)}>
                <View style={styles.molHeader}>
                  <Text style={styles.molName}>{med.name}</Text>
                  <View style={styles.molKindBadge}>
                    <Text style={styles.molKindText}>{kindLabel(med.kind)}</Text>
                  </View>
                </View>
                {med.posology ? <Text style={styles.molPoso}>{med.posology}</Text> : null}
              </Pressable>
              <Pressable
                onPress={() => handleRemove(med)}
                hitSlop={8}
                accessibilityLabel={labels.deleteConfirm}
                testID={`med-delete-${med.id}`}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.addBtn} onPress={openAdd} testID="med-add-button">
        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
        <Text style={styles.addBtnText}>{labels.add}</Text>
      </Pressable>

      <MedicationEditorModal
        visible={modalOpen}
        initial={editing}
        labels={{
          title: editing ? labels.editTitle : labels.addTitle,
          name: labels.name,
          posology: labels.posology,
          kindMaintenance: labels.kindMaintenance,
          kindPrn: labels.kindPrn,
          save: labels.save,
          cancel: labels.cancel,
        }}
        onCancel={closeModal}
        onSave={handleSave}
      />
    </ScrollView>
  )
}
