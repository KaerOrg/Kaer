import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import { fetchDefusionTechniques, updateDefusionTechniques } from '@services/moduleAssignmentService'
import { DEFUSION_TECHNIQUES, type DefusionTechnique } from '../../../lib/defusionTechniques'
import type { PatientModule } from '../../../lib/database.types'

/**
 * Éditeur praticien des techniques proposées de « Décrocher d'une pensée »
 * (patient_modules.config.enabled_techniques, lu par le mobile #197). Brouillon
 * local + enregistrement explicite (Annuler / Enregistrer). Garde : au moins une
 * technique active — le dernier toggle actif est verrouillé.
 */
export function useDefusionConfigEditor(
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [enabled, setEnabled] = useState<DefusionTechnique[]>([...DEFUSION_TECHNIQUES])
  const [saving, setSaving] = useState(false)

  const module = modules.find(m => m.module_type === 'cognitive_saturation')

  const openEditor = async () => {
    if (!module) return
    setEnabled(await fetchDefusionTechniques(module.id))
  }

  const toggle = (technique: DefusionTechnique) => {
    setEnabled(prev => {
      const isOn = prev.includes(technique)
      // Garde : au moins une technique active (le dernier actif est verrouillé).
      if (isOn && prev.length === 1) return prev
      // Reconstruit depuis l'ordre canonique pour rester stable.
      return DEFUSION_TECHNIQUES.filter(techn => techn === technique ? !isOn : prev.includes(techn))
    })
  }

  const save = async (): Promise<boolean> => {
    if (!module) return false
    setSaving(true)
    const { ok } = await updateDefusionTechniques(module.id, enabled)
    setSaving(false)
    if (!ok) {
      toast.error(t('common.error_generic'))
      return false
    }
    await onReloadModules()
    return true
  }

  return { module, enabled, saving, openEditor, toggle, save }
}
