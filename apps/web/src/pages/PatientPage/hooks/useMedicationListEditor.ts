import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import { fetchMedications, updateMedications } from '../../../services/moduleAssignmentService'
import type { PatientModule } from '../../../lib/database.types'
import type { Medication, MedicationKind } from '@psytool/shared'

function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export interface MedicationDraft {
  name: string
  posology: string
  kind: MedicationKind
}

// Éditeur praticien de la liste de médicaments (traitement de fond + si-besoin).
// Liste co-éditée avec le patient (patient_modules.config.medications).
export function useMedicationListEditor(
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])
  const [saving, setSaving] = useState(false)

  const module = modules.find(m => m.module_type === 'medication_adherence')

  const openEditor = async () => {
    if (!module) return
    const list = await fetchMedications(module.id)
    setMedications(list)
    setOpen(true)
  }

  const close = () => setOpen(false)

  const persist = async (next: Medication[]) => {
    if (!module) return
    setMedications(next)
    setSaving(true)
    const { ok } = await updateMedications(module.id, next)
    setSaving(false)
    if (!ok) {
      toast.error(t('common.error_generic'))
      return
    }
    await onReloadModules()
  }

  const addMedication = (draft: MedicationDraft) => {
    const name = draft.name.trim()
    if (name.length === 0) return
    void persist([...medications, { id: genId(), name, posology: draft.posology.trim(), kind: draft.kind }])
  }

  const removeMedication = (id: string) => {
    void persist(medications.filter(m => m.id !== id))
  }

  return { module, open, medications, saving, openEditor, close, addMedication, removeMedication }
}
