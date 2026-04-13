import { supabase } from './supabase'

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

/**
 * Marque une carte de psychoéducation comme lue dans Supabase.
 *
 * Stratégie :
 *   1. Lire la ligne patient_modules pour module_type = 'psychoeducation'
 *   2. Mettre à jour is_read = true pour la carte ciblée dans le tableau JSONB
 *   3. Réécrire le config complet (Supabase JS ne supporte pas la mise à jour
 *      partielle d'un tableau JSONB sans fonction RPC)
 *
 * Prérequis RLS : la politique "modules_patient_update" doit être active
 * (voir supabase/schema.sql).
 */
export async function markCardAsRead(
  patientId: string,
  cardId: string
): Promise<void> {
  // 1. Récupérer la ligne actuelle
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

  // 2. Mettre à jour uniquement la carte ciblée
  const updatedCards = currentCards.map((card) =>
    card.card_id === cardId ? { ...card, is_read: true } : card
  )

  // 3. Réécrire le config
  const { error: updateError } = await supabase
    .from('patient_modules')
    .update({
      config: { ...data.config, unlocked_cards: updatedCards },
    })
    .eq('id', data.id)

  if (updateError) throw updateError
}
