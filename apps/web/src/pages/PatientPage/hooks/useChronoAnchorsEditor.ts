import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import {
  fetchChronoAnchorCatalog,
  fetchTrackedAnchors,
  updateTrackedAnchors,
  type ChronoAnchor,
} from '../../../services/moduleAssignmentService'
import type { PatientModule } from '../../../lib/database.types'

// Éditeur praticien des ancres « Rythmes & régularité » suivies pour un patient.
// Config partagée avec le patient (patient_modules.config.anchors). Une config vide
// = toutes les ancres suivies (défaut) ; dès qu'on configure, la sélection est explicite.
export function useChronoAnchorsEditor(
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [catalog, setCatalog] = useState<ChronoAnchor[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const module = modules.find(m => m.module_type === 'chronobiology_tracker')

  const openEditor = async () => {
    if (!module) return
    const [cat, sel] = await Promise.all([
      fetchChronoAnchorCatalog(),
      fetchTrackedAnchors(module.id),
    ])
    setCatalog(cat)
    // Config vide = toutes les ancres suivies (défaut) ; on initialise la sélection
    // locale à tout le catalogue pour que désélectionner une ancre persiste le reste.
    setSelected(sel.length > 0 ? sel : cat.map(a => a.key))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const persist = async (next: string[]) => {
    if (!module) return
    setSelected(next)
    setSaving(true)
    const { ok } = await updateTrackedAnchors(module.id, next)
    setSaving(false)
    if (!ok) {
      toast.error(t('common.error_generic'))
      return
    }
    await onReloadModules()
  }

  const toggle = (key: string) => {
    const next = selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key]
    // Garde-fou : au moins une ancre doit rester suivie (un journal vide n'a pas de sens).
    if (next.length === 0) {
      toast.error(t('modules.chronobiology_tracker.config_min_anchor'))
      return
    }
    void persist(next)
  }

  const isSelected = (key: string) => selected.includes(key)

  return { module, open, catalog, selected, saving, openEditor, close, toggle, isSelected }
}
