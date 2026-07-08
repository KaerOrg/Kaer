import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import {
  unlockPsychoeducation,
  updatePsychoeducationTopics,
} from '@services/moduleAssignmentService'
import type { PatientModule, PsychoeducationTopicEntry } from '../../../lib/database.types'

type PickerMode = 'off' | 'unlock' | 'edit'

function getUnlockedTopics(mod: PatientModule): PsychoeducationTopicEntry[] {
  const config = mod.config as { unlocked_topics?: PsychoeducationTopicEntry[] }
  return config?.unlocked_topics ?? []
}

export function usePsychoEducationPicker(
  modules: PatientModule[],
  patientId: string,
  practitionerId: string,
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [mode, setMode] = useState<PickerMode>('off')
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const psychoModule = modules.find(m => m.module_type === 'psychoeducation')

  const open = (openMode: 'unlock' | 'edit') => {
    setError(null)
    if (openMode === 'edit' && psychoModule) {
      setSelectedTopicIds(new Set(getUnlockedTopics(psychoModule).map(tpc => tpc.topic_id)))
    } else {
      // Débloquer : aucune fiche pré-cochée, le praticien choisit explicitement.
      setSelectedTopicIds(new Set())
    }
    setMode(openMode)
  }

  const cancel = () => {
    setMode('off')
    setError(null)
  }

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev)
      if (next.has(topicId)) { next.delete(topicId) } else { next.add(topicId) }
      return next
    })
  }

  // Retourne `true` si les fiches ont été enregistrées (module créé/mis à jour),
  // `false` sur validation (aucune fiche) ou erreur d'écriture — l'appelant ferme la
  // modale uniquement en cas de succès.
  const confirm = async (): Promise<boolean> => {
    if (selectedTopicIds.size === 0) {
      setError(t('patient.psycho_pick_error'))
      return false
    }
    setSaving(true)
    setError(null)

    if (mode === 'unlock') {
      const { ok } = await unlockPsychoeducation(patientId, practitionerId, selectedTopicIds)
      if (!ok) {
        toast.error(t('patient.psycho_error_unlock'))
        setSaving(false)
        return false
      }
    } else if (mode === 'edit' && psychoModule) {
      const { ok } = await updatePsychoeducationTopics(
        psychoModule.id,
        getUnlockedTopics(psychoModule),
        selectedTopicIds,
      )
      if (!ok) {
        toast.error(t('patient.psycho_error_update'))
        setSaving(false)
        return false
      }
    }

    setSaving(false)
    setMode('off')
    await onReloadModules()
    return true
  }

  return {
    psychoModule,
    getUnlockedTopics,
    mode,
    selectedTopicIds,
    saving,
    error,
    open,
    cancel,
    toggleTopic,
    confirm,
  }
}
