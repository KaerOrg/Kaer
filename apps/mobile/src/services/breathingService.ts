import {
  saveBreathingSession as dbSave,
  getAllBreathingSessions as dbGetAll,
  type BreathingSession,
} from '../lib/database'
import type { ContentField } from '@kaer/shared'
import { fetchModuleFields } from './moduleService'
import { syncUpsert } from './syncHelpers'

export type { BreathingSession }

// ─── Config des techniques (lue depuis la base, issue #69) ───────────────────
// La définition des techniques (couleur, durée recommandée, phases) vit dans
// module_content_fields / field_props (cf. supabase/seed.sql), plus dans un
// tableau TypeScript. Les libellés (nom, sous-titre, description, niveau de
// preuve, label de phase) restent en i18n : modules.breathing_techniques.*.

const MODULE_ID = 'breathing_techniques'

export type PhaseType = 'inhale' | 'hold_in' | 'exhale' | 'hold_out'

export interface BreathingPhase {
  type: PhaseType
  seconds: number
}

export interface BreathingTechnique {
  key: string
  color: string
  recommended_duration_min: number
  phases: BreathingPhase[]
}

/** Durée totale d'un cycle en secondes. */
export function getCycleDuration(technique: BreathingTechnique): number {
  return technique.phases.reduce((acc, p) => acc + p.seconds, 0)
}

function toPhase(field: ContentField): BreathingPhase {
  return {
    type: field.props.phase_type as PhaseType,
    seconds: Number(field.props.phase_seconds),
  }
}

function toTechnique(field: ContentField): BreathingTechnique {
  const phases = [...field.children]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toPhase)
  return {
    key: field.props.technique_key,
    color: field.props.color,
    recommended_duration_min: Number(field.props.recommended_duration_min),
    phases,
  }
}

/**
 * Charge les techniques de respiration depuis la base, ordonnées par sort_order.
 * S'appuie sur le cache mémoire de fetchModuleFields (un fetch par session).
 */
export async function fetchBreathingTechniques(): Promise<BreathingTechnique[]> {
  const { fields } = await fetchModuleFields(MODULE_ID)
  return fields
    .filter((f) => f.field_type === 'breathing_technique')
    .map(toTechnique)
}

/** Historique local des sessions de respiration, les plus récentes d'abord. */
export async function fetchBreathingSessions(limit = 200): Promise<BreathingSession[]> {
  return dbGetAll(limit)
}

export async function saveBreathingSession(session: Omit<BreathingSession, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(session), {
    local_id: session.id,
    module_id: MODULE_ID,
    entry_kind: 'breathing_session',
    payload: {
      date: session.date,
      technique_key: session.technique_key,
      duration_seconds: session.duration_seconds,
    },
  })
}
