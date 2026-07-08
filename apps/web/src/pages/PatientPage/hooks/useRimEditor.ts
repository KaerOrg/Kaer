import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import { unlockRim, updateRim } from '@services/moduleAssignmentService'
import type { PatientModule } from '../../../lib/database.types'

type RimEditorMode = 'off' | 'unlock' | 'edit'

type RimConfig = {
  alternative_scenario?: string
  original_scenario?: string
}

export function useRimEditor(
  modules: PatientModule[],
  patientId: string,
  practitionerId: string,
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [mode, setMode] = useState<RimEditorMode>('off')
  const [alternative, setAlternative] = useState('')
  const [original, setOriginal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rimModule = modules.find(m => m.module_type === 'rim')

  const open = (openMode: 'unlock' | 'edit') => {
    setError(null)
    if (openMode === 'edit' && rimModule) {
      const cfg = rimModule.config as RimConfig
      setAlternative(cfg.alternative_scenario ?? '')
      setOriginal(cfg.original_scenario ?? '')
    } else {
      setAlternative('')
      setOriginal('')
    }
    setMode(openMode)
  }

  const cancel = () => {
    setMode('off')
    setError(null)
  }

  // Retourne `true` si la config a été enregistrée (module créé/mis à jour), `false`
  // sur erreur de validation ou d'écriture — l'appelant s'en sert pour fermer la modale
  // uniquement en cas de succès.
  const confirm = async (): Promise<boolean> => {
    if (!alternative.trim()) {
      setError(t('patient.rim_error_required'))
      return false
    }
    setSaving(true)
    setError(null)
    const scenario = { alternative: alternative.trim(), original: original.trim() }

    if (mode === 'unlock') {
      const { ok } = await unlockRim(patientId, practitionerId, scenario)
      if (!ok) { toast.error(t('patient.rim_error_unlock')); setSaving(false); return false }
    } else if (mode === 'edit' && rimModule) {
      const { ok } = await updateRim(rimModule.id, scenario)
      if (!ok) { toast.error(t('patient.rim_error_update')); setSaving(false); return false }
    }

    setSaving(false)
    setMode('off')
    await onReloadModules()
    return true
  }

  return {
    rimModule,
    mode,
    alternative,
    original,
    saving,
    error,
    open,
    cancel,
    confirm,
    setAlternative,
    setOriginal,
  }
}
