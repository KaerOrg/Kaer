import { supabase } from '../lib/supabase'

/**
 * Résumé de suivi affiché en tête de l'écran Profil. Valeurs BRUTES et
 * descriptives (MDR 2017/745) : ancienneté d'inscription, nombre de modules
 * débloqués, nombre de séances honorées. Aucun seuil, aucune interprétation.
 */
export interface ProfileStats {
  /** Horodatage d'inscription (patients.created_at) ; null si le profil est absent. */
  createdAt: string | null
  /** Nombre de modules actuellement débloqués pour le patient. */
  activeModules: number
  /** Nombre de rendez-vous honorés (statut « completed »). */
  sessions: number
}

/**
 * Lit en une passe (trois requêtes parallèles) les données du résumé de suivi.
 * Les comptages utilisent `head: true` + `count: 'exact'` : aucune ligne
 * ramenée, seul le total est transféré.
 */
export async function fetchProfileStats(patientId: string): Promise<ProfileStats> {
  const [profile, modules, sessions] = await Promise.all([
    supabase.from('patients').select('created_at').eq('id', patientId).maybeSingle(),
    supabase
      .from('patient_modules')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'completed'),
  ])

  const createdAt = (profile.data?.created_at as string | undefined) ?? null
  return {
    createdAt,
    activeModules: modules.count ?? 0,
    sessions: sessions.count ?? 0,
  }
}
