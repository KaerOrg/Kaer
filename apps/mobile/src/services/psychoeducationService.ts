import { supabase } from '../lib/supabase'

// Type local miroir de PsychoeducationCardEntry (shared)
export interface UnlockedCard {
  card_id: string
  is_read: boolean
  unlocked_at: string
}

interface PsychoModuleRow {
  id: string
  config: {
    unlocked_cards?: UnlockedCard[]
  }
}

export type FetchUnlockedCardsResult =
  | { ok: true; cards: UnlockedCard[] }
  | { ok: false }

/** Lit la liste des cartes débloquées (et leur statut lu/non-lu) pour un patient. */
export async function fetchUnlockedCards(patientId: string): Promise<FetchUnlockedCardsResult> {
  const { data, error } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', 'psychoeducation')
    .is('revoked_at', null)
    .single<{ config: { unlocked_cards?: UnlockedCard[] } }>()

  if (error) return { ok: false }
  return { ok: true, cards: data?.config?.unlocked_cards ?? [] }
}

/**
 * Marque une carte de psychoéducation comme lue dans Supabase.
 * Stratégie : lire la ligne, muter le tableau JSONB unlocked_cards, réécrire
 * le config complet (Supabase JS ne supporte pas la mise à jour partielle
 * d'un tableau JSONB sans fonction RPC).
 */
export async function markCardAsRead(
  patientId: string,
  cardId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('patient_modules')
    .select('id, config')
    .eq('patient_id', patientId)
    .eq('module_type', 'psychoeducation')
    .is('revoked_at', null)
    .single<PsychoModuleRow>()

  if (error || !data) {
    throw error ?? new Error('Module de psychoéducation introuvable')
  }

  const currentCards: UnlockedCard[] = data.config?.unlocked_cards ?? []

  const updatedCards = currentCards.map((card) =>
    card.card_id === cardId ? { ...card, is_read: true } : card
  )

  const { error: updateError } = await supabase
    .from('patient_modules')
    .update({
      config: { ...data.config, unlocked_cards: updatedCards },
    })
    .eq('id', data.id)

  if (updateError) throw updateError
}
