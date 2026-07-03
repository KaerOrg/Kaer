import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../contexts/ToastContext'
import { crisisQueries } from '../../../hooks/queries'
import {
  saveCrisisPlanConfig,
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
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<CrisisPlanConfig>({ practitionerMessage: '', copingCards: [], commitmentPhrase: '' })
  const [cardDraft, setCardDraft] = useState<{ thought: string; response: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const crisisPlanModule = modules.find(m => m.module_type === 'crisis_plan')
  // Le plan est "configuré" dès qu'il y a au moins un contenu praticien enregistré
  const isConfigured = !!(crisisPlanModule && (config.practitionerMessage || config.copingCards.length > 0 || config.commitmentPhrase))

  const openEditor = async () => {
    // Amorce le formulaire depuis le cache React Query (fetch réseau seulement si
    // absent/périmé), puis édite en state local — pattern « form amorcé du serveur ».
    const cfg = await queryClient.fetchQuery(crisisQueries.planConfig(patientId))
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
    // Invalide le cache partagé → les 3 widgets d'aperçu (anchors/coping/commitment)
    // se rechargent avec la nouvelle config.
    await queryClient.invalidateQueries({ queryKey: crisisQueries.planConfig(patientId).queryKey })
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
