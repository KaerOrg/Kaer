import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../contexts/ToastContext'
import { crisisQueries } from '../../../hooks/queries'
import {
  saveCrisisPlanConfig,
  type CrisisPlanConfig,
} from '@services/crisisPlanService'
import type { PatientModule } from '../../../lib/database.types'

export function useCrisisPlanEditor(
  patientId: string,
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<CrisisPlanConfig>({ practitionerMessage: '' })
  const [saving, setSaving] = useState(false)

  const crisisPlanModule = modules.find(m => m.module_type === 'crisis_plan')
  // Le plan est "configuré" dès qu'il y a un message praticien enregistré
  const isConfigured = !!(crisisPlanModule && config.practitionerMessage)

  const openEditor = async () => {
    // Amorce le formulaire depuis le cache React Query (fetch réseau seulement si
    // absent/périmé), puis édite en state local — pattern « form amorcé du serveur ».
    const cfg = await queryClient.fetchQuery(crisisQueries.planConfig(patientId))
    setConfig(cfg)
    setOpen(true)
  }

  const closeEditor = () => {
    setOpen(false)
  }

  // Retourne `true` si la config a été enregistrée, `false` sur erreur — l'appelant
  // ferme la modale uniquement en cas de succès.
  const saveEditor = async (): Promise<boolean> => {
    setSaving(true)
    const { ok } = await saveCrisisPlanConfig(patientId, config)
    setSaving(false)
    if (!ok) { toast.error(t('patient.crisis_error_save')); return false }
    // Invalide le cache partagé → le widget d'aperçu des ancres se recharge avec
    // la nouvelle config (message du praticien).
    await queryClient.invalidateQueries({ queryKey: crisisQueries.planConfig(patientId).queryKey })
    toast.success(t('common.saved'))
    setOpen(false)
    await onReloadModules()
    return true
  }

  return {
    open,
    config,
    setConfig,
    saving,
    isConfigured,
    openEditor,
    closeEditor,
    saveEditor,
  }
}
