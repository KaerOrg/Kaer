import { supabase } from '../lib/supabase'
import type { BAConfiguredActivity } from '@kaer/shared'

const MODULE = 'behavioral_activation'

// Activités co-construites en consultation (domaine de vie + phrase « valeur »),
// stockées dans patient_modules.config.ba_activities. Définies par le praticien
// depuis l'app web ; le patient les lit ici pour les proposer en premier dans le
// formulaire d'activité. Donnée de setup (occasionnelle), lue en ligne — les
// saisies d'activités, elles, restent offline-first (activity_records).
export async function fetchBAActivities(patientId: string): Promise<BAConfiguredActivity[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', MODULE)
    .maybeSingle()
  const cfg = (data?.config ?? {}) as Record<string, unknown>
  const activities = cfg['ba_activities']
  if (!Array.isArray(activities)) return []
  return activities as BAConfiguredActivity[]
}
