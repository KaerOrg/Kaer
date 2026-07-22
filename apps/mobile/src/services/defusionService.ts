import {
  saveDefusionSession as dbSave,
  getAllDefusionSessions as dbGetAll,
  deleteDefusionSession as dbDelete,
  type DefusionSession,
  type DefusionTechnique,
} from '../lib/database'
import { fetchPatientModuleConfig } from './moduleService'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { DefusionSession, DefusionTechnique }

// Le module conserve son identifiant historique `cognitive_saturation` (catalogue,
// déblocage praticien, GRAPHABLE_MODULE_TYPES) ; seul son modèle de données est
// refondu (table `defusion_sessions`, entry_kind `defusion_session`).
const MODULE_ID = 'cognitive_saturation'

/** Ordre canonique d'affichage des techniques (répétition de mot en principale). */
export const ALL_TECHNIQUES: readonly DefusionTechnique[] = [
  'word_repetition',
  'linguistic_distancing',
]

/** Historique local des séances, les plus récentes d'abord. */
export async function fetchDefusionSessions(limit = 200): Promise<DefusionSession[]> {
  return dbGetAll(limit)
}

/** Écrit la séance en SQLite puis l'enfile vers Supabase (cf. sync-service.md). */
export async function saveDefusionSession(
  session: Omit<DefusionSession, 'created_at'>,
): Promise<void> {
  await syncUpsert(() => dbSave(session), {
    local_id: session.id,
    module_id: MODULE_ID,
    entry_kind: 'defusion_session',
    payload: {
      technique: session.technique,
      word_or_thought: session.word_or_thought,
      duration_seconds: session.duration_seconds,
      discomfort_before: session.discomfort_before,
      discomfort_after: session.discomfort_after,
      belief_before: session.belief_before,
      belief_after: session.belief_after,
    },
  })
}

/** Supprime la séance en SQLite puis enfile la suppression vers Supabase. */
export async function removeDefusionSession(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, MODULE_ID, 'defusion_session')
}

/**
 * Techniques activées par le praticien, dérivées d'une config déjà chargée
 * (`patient_modules.config`). Pur — partagé par `fetchEnabledTechniques` (service)
 * et `DefusionLayout` (qui reçoit déjà `patientConfig` et évite un second appel).
 * Défaut robuste = les deux techniques : au déblocage le web initialise les deux,
 * mais une config absente, vide ou malformée ne doit jamais masquer le module au
 * patient. L'ordre canonique de `ALL_TECHNIQUES` est préservé.
 */
export function enabledTechniquesFromConfig(
  config: Record<string, unknown> | null,
): DefusionTechnique[] {
  const raw = config?.enabled_techniques
  if (!Array.isArray(raw)) return [...ALL_TECHNIQUES]
  const enabled = ALL_TECHNIQUES.filter((technique) => raw.includes(technique))
  return enabled.length > 0 ? enabled : [...ALL_TECHNIQUES]
}

/**
 * Techniques activées pour ce patient, lues depuis Supabase
 * (`patient_modules.config.enabled_techniques`, écrit par le web, epic #201 story 5).
 */
export async function fetchEnabledTechniques(
  patientId: string,
): Promise<DefusionTechnique[]> {
  const config = await fetchPatientModuleConfig(patientId, MODULE_ID)
  return enabledTechniquesFromConfig(config)
}
