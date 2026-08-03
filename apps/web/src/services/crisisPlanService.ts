import { toLocalIsoDate } from '@kaer/shared'
import { supabase } from '../lib/supabase'

export interface CrisisPlanConfig {
  practitionerMessage: string
  /**
   * Jour de la première élaboration conjointe du plan (PW-5). `null` tant que le
   * praticien n'a pas encore marqué de revue.
   */
  createdWithAt: string | null
  /**
   * Jour de la dernière revue **en consultation**. À ne jamais confondre avec le
   * `updated_at` d'un item (« modifié »), ni avec une lecture du plan par le patient,
   * qui n'est pas mesurée.
   *
   * MDR 2017/745 : affichée, jamais surveillée. Ne jamais la comparer à la date du jour
   * pour produire une alerte d'ancienneté, un badge « à revoir » ou une couleur.
   */
  lastReviewedAt: string | null
}

export interface ServiceResult {
  ok: boolean
  message?: string
}

// Pas de cache module-level : React Query (crisisQueries.planConfig) est l'unique
// couche de cache et déduplique les widgets d'aperçu ; l'invalidation à l'écriture
// (useSaveCrisisPlan) garantit la fraîcheur. Un cache Map masquerait cette invalidation.
export async function fetchCrisisPlanConfig(patientId: string): Promise<CrisisPlanConfig> {
  const { data } = await supabase
    .from('crisis_plan_configs')
    .select('practitioner_message, created_with_at, last_reviewed_at')
    .eq('patient_id', patientId)
    .maybeSingle()

  return {
    practitionerMessage: data?.practitioner_message ?? '',
    createdWithAt: data?.created_with_at ?? null,
    lastReviewedAt: data?.last_reviewed_at ?? null,
  }
}

// Les deux dates ne sont PAS écrites ici : `saveCrisisPlanConfig` ne porte que le
// message de soutien. L'upsert ne liste que les colonnes qu'il met à jour, donc
// `created_with_at` et `last_reviewed_at` gardent leur valeur : enregistrer un message
// n'est pas une revue du plan.
export async function saveCrisisPlanConfig(
  patientId: string,
  config: Pick<CrisisPlanConfig, 'practitionerMessage'>,
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('crisis_plan_configs')
    .upsert({
      patient_id: patientId,
      practitioner_message: config.practitionerMessage,
      updated_at: new Date().toISOString(),
    })
  if (error) return { ok: false, message: error.message }

  return { ok: true }
}

/**
 * Marque le plan comme revu **aujourd'hui**, en consultation (PW-5).
 *
 * Un appui, pas un formulaire. Le jour vient des getters LOCAUX (`toLocalIsoDate`) et
 * jamais de `toISOString()` : en fuseau positif, minuit local retombe la veille en UTC,
 * et une revue du 4 juin s'afficherait au 3.
 *
 * **Idempotent dans la journée** : deux appuis le même jour écrivent la même date, donc
 * ne comptent que pour une revue. La garde ci-dessous évite en plus l'aller-retour
 * réseau inutile.
 *
 * `created_with_at` n'est posé qu'à la première revue et n'est jamais réécrit ensuite :
 * c'est la date de la première élaboration conjointe, pas celle de la dernière.
 */
export async function markPlanReviewedToday(
  patientId: string,
  current: Pick<CrisisPlanConfig, 'createdWithAt' | 'lastReviewedAt'>,
): Promise<ServiceResult> {
  const today = toLocalIsoDate(new Date())
  if (current.lastReviewedAt === today) return { ok: true }

  const { error } = await supabase
    .from('crisis_plan_configs')
    .upsert({
      patient_id: patientId,
      last_reviewed_at: today,
      created_with_at: current.createdWithAt ?? today,
      updated_at: new Date().toISOString(),
    })
  if (error) return { ok: false, message: error.message }

  return { ok: true }
}
