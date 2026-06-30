import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../contexts/ToastContext'
import {
  fetchCrisisPlanConfig,
  saveCrisisPlanConfig,
  clearCrisisPlanConfigCache,
  type CrisisPlanConfig,
  type CrisisPlanCopingCard,
} from '@services/crisisPlanService'
import type { PatientModule } from '../../../lib/database.types'

export function useCrisisPlanEditor(
  patientId: string,
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<CrisisPlanConfig>({ practitionerMessage: '', copingCards: [], commitmentPhrase: '' })
  const [cardDraft, setCardDraft] = useState<{ thought: string; response: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const crisisPlanModule = modules.find(m => m.module_type === 'crisis_plan')
  // Le plan est "configuré" dès qu'il y a au moins un contenu praticien enregistré
  const isConfigured = !!(crisisPlanModule && (config.practitionerMessage || config.copingCards.length > 0 || config.commitmentPhrase))

  const openEditor = async () => {
    const cfg = await fetchCrisisPlanConfig(patientId)
    setConfig(cfg)
    setCardDraft(null)
    setOpen(true)
  }

  const closeEditor = () => {
    setOpen(false)
    setCardDraft(null)
  }

  const saveEditor = async () => {
    setSaving(true)
    const { ok } = await saveCrisisPlanConfig(patientId, config)
    setSaving(false)
    if (!ok) { toast.error(t('patient.crisis_error_save')); return }
    clearCrisisPlanConfigCache()
    toast.success(t('common.saved'))
    setOpen(false)
    await onReloadModules()
  }

  const addCopingCard = () => {
    if (!cardDraft) { setCardDraft({ thought: '', response: '' }); return }
    if (!cardDraft.thought.trim() || !cardDraft.response.trim()) return
    const newCard: CrisisPlanCopingCard = {
      id: `card_${Date.now()}`,
      thought: cardDraft.thought.trim(),
      response: cardDraft.response.trim(),
    }
    setConfig(prev => ({ ...prev, copingCards: [...prev.copingCards, newCard] }))
    setCardDraft(null)
  }

  const removeCopingCard = (cardId: string) => {
    setConfig(prev => ({ ...prev, copingCards: prev.copingCards.filter(c => c.id !== cardId) }))
  }

  return {
    open,
    config,
    setConfig,
    cardDraft,
    setCardDraft,
    saving,
    isConfigured,
    openEditor,
    closeEditor,
    saveEditor,
    addCopingCard,
    removeCopingCard,
  }
}
