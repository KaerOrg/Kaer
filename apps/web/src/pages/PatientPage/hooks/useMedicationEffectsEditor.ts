import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import { fetchTrackedEffects, updateTrackedEffects } from '@services/moduleAssignmentService'
import {
  CUSTOM_EFFECT_PALETTE,
  makeCustomKey,
  type TrackedEffect,
} from '../../../lib/sideEffectsCatalog'
import type { PatientModule } from '../../../lib/database.types'

// Éditeur praticien des effets indésirables suivis pour un patient.
// Config partagée avec le patient (patient_modules.config.tracked_effects).
export function useMedicationEffectsEditor(
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [tracked, setTracked] = useState<TrackedEffect[]>([])
  const [saving, setSaving] = useState(false)

  const module = modules.find(m => m.module_type === 'medication_side_effects')

  const openEditor = async () => {
    if (!module) return
    const list = await fetchTrackedEffects(module.id)
    setTracked(list)
    setOpen(true)
  }

  const close = () => setOpen(false)

  const persist = async (next: TrackedEffect[]) => {
    if (!module) return
    setTracked(next)
    setSaving(true)
    const { ok } = await updateTrackedEffects(module.id, next)
    setSaving(false)
    if (!ok) {
      toast.error(t('common.error_generic'))
      return
    }
    await onReloadModules()
  }

  const toggleFixed = (key: string) => {
    const exists = tracked.some(e => e.key === key)
    void persist(exists ? tracked.filter(e => e.key !== key) : [...tracked, { key }])
  }

  const addCustom = (label: string) => {
    const l = label.trim()
    if (l.length === 0) return
    const usedColors = tracked.filter(e => e.color).length
    const color = CUSTOM_EFFECT_PALETTE[usedColors % CUSTOM_EFFECT_PALETTE.length]
    void persist([...tracked, { key: makeCustomKey(), custom: true, label: l, color }])
  }

  const removeEffect = (key: string) => {
    void persist(tracked.filter(e => e.key !== key))
  }

  return { module, open, tracked, saving, openEditor, close, toggleFixed, addCustom, removeEffect }
}
