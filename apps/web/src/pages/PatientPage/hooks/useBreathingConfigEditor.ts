import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../contexts/ToastContext'
import {
  updateBreathingPractitionerConfig,
  type BreathingPractitionerConfig,
} from '@services/moduleAssignmentService'
import { moduleQueries } from '../../../hooks/queries'
import type { PatientModule } from '../../../lib/database.types'

/** Bornes de l'objectif hebdomadaire, alignées sur le `check` de la base (1 à 14). */
export const BREATHING_GOAL_MIN = 1
export const BREATHING_GOAL_MAX = 14

/**
 * État de chargement du brouillon. Tant que la config n'est pas lue, le formulaire
 * n'est pas rendu : l'enregistrer avant sa lecture écraserait l'activation réelle
 * par une activation vide.
 */
type DraftState =
  | { status: 'loading' }
  | { status: 'ready'; draft: BreathingPractitionerConfig }

const LOADING: DraftState = { status: 'loading' }

/**
 * Éditeur praticien du module respiration : quelles techniques le patient voit,
 * laquelle porte le badge « en séance », et l'objectif proposé.
 *
 * L'activation vit dans `patient_modules.config` (canal lu par le mobile), jamais
 * dans la table `breathing_settings` qui porte les préférences d'appareil du patient.
 *
 * Brouillon local + enregistrement explicite, comme les autres éditeurs de config.
 */
export function useBreathingConfigEditor(
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [state, setState] = useState<DraftState>(LOADING)
  const [saving, setSaving] = useState(false)

  const module = modules.find(m => m.module_type === 'breathing_techniques')

  // Amorçage du brouillon par la factory, jamais par un appel de service direct : la
  // clé est canonique, donc l'aperçu Vue patient qui lit la même config partage le
  // cache au lieu de refetcher (garde-fou `noRawFetch`).
  const openEditor = useCallback(async () => {
    if (!module) return
    setState(LOADING)
    setState({
      status: 'ready',
      draft: await queryClient.fetchQuery(moduleQueries.breathingConfig(module.id)),
    })
  }, [module, queryClient])

  /** Active ou désactive une technique. Désactiver la principale la démet aussi. */
  const toggleTechnique = useCallback((key: string) => {
    setState(prev => {
      if (prev.status !== 'ready') return prev
      const { draft } = prev
      const isOn = draft.enabledTechniques.includes(key)
      const enabledTechniques = isOn
        ? draft.enabledTechniques.filter(k => k !== key)
        : [...draft.enabledTechniques, key]
      // La technique de séance doit rester parmi les activées, sans quoi le patient
      // verrait un badge sur une technique qui a disparu de son app.
      const primaryTechnique = enabledTechniques.includes(draft.primaryTechnique ?? '')
        ? draft.primaryTechnique
        : enabledTechniques[0] ?? null
      return { status: 'ready', draft: { ...draft, enabledTechniques, primaryTechnique } }
    })
  }, [])

  /** Désigne la technique travaillée en séance. Sans effet si elle n'est pas activée. */
  const setPrimary = useCallback((key: string) => {
    setState(prev => {
      if (prev.status !== 'ready' || !prev.draft.enabledTechniques.includes(key)) return prev
      return { status: 'ready', draft: { ...prev.draft, primaryTechnique: key } }
    })
  }, [])

  const setGoal = useCallback((weeklyGoalSessions: number | null) => {
    setState(prev => prev.status === 'ready'
      ? { status: 'ready', draft: { ...prev.draft, weeklyGoalSessions } }
      : prev)
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    if (!module || state.status !== 'ready') return false
    setSaving(true)
    const { ok } = await updateBreathingPractitionerConfig(module.id, state.draft)
    setSaving(false)
    if (!ok) {
      toast.error(t('common.error_generic'))
      return false
    }
    // L'aperçu Vue patient lit la même clé : sans invalidation, il montrerait encore
    // l'activation d'avant.
    await queryClient.invalidateQueries({ queryKey: moduleQueries.breathingConfig(module.id).queryKey })
    await onReloadModules()
    return true
  }, [module, state, toast, t, queryClient, onReloadModules])

  return {
    module,
    draft: state.status === 'ready' ? state.draft : null,
    saving,
    openEditor,
    toggleTechnique,
    setPrimary,
    setGoal,
    save,
  }
}
