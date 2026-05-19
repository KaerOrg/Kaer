import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import {
  unlockPsychoeducation,
  updatePsychoeducationCards,
} from '../../../services/moduleAssignmentService'
import type { PatientModule, PsychoeducationCardEntry } from '../../../lib/database.types'
import type { PsychoCardInfo } from '../../../services/moduleService'

type PickerMode = 'off' | 'unlock' | 'edit'

function getUnlockedCards(mod: PatientModule): PsychoeducationCardEntry[] {
  const config = mod.config as { unlocked_cards?: PsychoeducationCardEntry[] }
  return config?.unlocked_cards ?? []
}

export function usePsychoEducationPicker(
  modules: PatientModule[],
  psychoCards: PsychoCardInfo[],
  patientId: string,
  practitionerId: string,
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [mode, setMode] = useState<PickerMode>('off')
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const psychoModule = modules.find(m => m.module_type === 'psychoeducation')

  const open = (openMode: 'unlock' | 'edit') => {
    setError(null)
    if (openMode === 'edit' && psychoModule) {
      setSelectedCardIds(new Set(getUnlockedCards(psychoModule).map(c => c.card_id)))
    } else {
      setSelectedCardIds(new Set(psychoCards.map(c => c.id)))
    }
    setMode(openMode)
  }

  const cancel = () => {
    setMode('off')
    setError(null)
  }

  const toggleCard = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) { next.delete(cardId) } else { next.add(cardId) }
      return next
    })
  }

  const confirm = async () => {
    if (selectedCardIds.size === 0) {
      setError(t('patient.psycho_pick_error'))
      return
    }
    setSaving(true)
    setError(null)

    if (mode === 'unlock') {
      const { ok } = await unlockPsychoeducation(patientId, practitionerId, selectedCardIds)
      if (!ok) {
        toast.error(t('patient.psycho_error_unlock'))
        setSaving(false)
        return
      }
    } else if (mode === 'edit' && psychoModule) {
      const { ok } = await updatePsychoeducationCards(
        psychoModule.id,
        getUnlockedCards(psychoModule),
        selectedCardIds,
      )
      if (!ok) {
        toast.error(t('patient.psycho_error_update'))
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setMode('off')
    await onReloadModules()
  }

  return {
    psychoModule,
    getUnlockedCards,
    mode,
    selectedCardIds,
    saving,
    error,
    open,
    cancel,
    toggleCard,
    confirm,
  }
}
