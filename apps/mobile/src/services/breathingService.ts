import {
  saveBreathingSession as dbSave,
  getAllBreathingSessions as dbGetAll,
  getBreathingSettings as dbGetSettings,
  saveBreathingSettings as dbSaveSettings,
  type BreathingSession,
  type BreathingSessionInput,
  type BreathingSettings,
} from '../lib/database'
import type { ContentField } from '@kaer/shared'
import { fetchModuleFields } from './moduleService'
import { syncUpsert } from './syncHelpers'

export type { BreathingSession, BreathingSessionInput, BreathingSettings }

// local_id stable : la config est une entrée unique par patient (upsert). On garde
// un entry_kind dédié 'breathing_setting' (plutôt que le 'module_setting' générique)
// pour que la future projection vers la table dédiée breathing_settings (phases M) se
// filtre sur le seul entry_kind, sans discriminer par module_id.
const SETTINGS_LOCAL_ID = 'breathing_settings'

// Applique les défauts métier d'une session — source unique des défauts (le stockage
// lib/ et le payload de sync en dérivent). `started_at` : instant fourni, sinon dérivé
// d'une date legacy, sinon maintenant.
function resolveSession(input: BreathingSessionInput): Omit<BreathingSession, 'created_at' | 'date'> {
  return {
    id: input.id,
    technique_key: input.technique_key,
    started_at: input.started_at ?? (input.date ? `${input.date}T00:00:00` : new Date().toISOString()),
    duration_seconds: input.duration_seconds,
    planned_duration_seconds: input.planned_duration_seconds ?? input.duration_seconds,
    cycles_completed: input.cycles_completed ?? 0,
    completed: input.completed ?? true,
    feeling: input.feeling ?? null,
  }
}

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
 * Convertit les fields d'un module en techniques de respiration.
 * Pur (aucun I/O) : partagé par `fetchBreathingTechniques` (service) et le layout
 * `breathing_pacer` (qui reçoit déjà les fields et évite un second fetch).
 */
export function techniquesFromFields(fields: ContentField[]): BreathingTechnique[] {
  return fields
    .filter((f) => f.field_type === 'breathing_technique')
    .map(toTechnique)
}

/**
 * Charge les techniques de respiration depuis la base, ordonnées par sort_order.
 * S'appuie sur le cache mémoire de fetchModuleFields (un fetch par session).
 */
export async function fetchBreathingTechniques(): Promise<BreathingTechnique[]> {
  const { fields } = await fetchModuleFields(MODULE_ID)
  return techniquesFromFields(fields)
}

/** Historique local des sessions de respiration, les plus récentes d'abord. */
export async function fetchBreathingSessions(limit = 200): Promise<BreathingSession[]> {
  return dbGetAll(limit)
}

/**
 * Enregistre une session (menée au bout OU interrompue) puis la synchronise.
 * `started_at` est l'instant métier de la session : il est aussi passé en
 * `client_created_at` pour que la vue praticien (web) place la saisie au bon jour
 * (parité web ≡ mobile, cf. sync des saisies rétroactives).
 */
export async function saveBreathingSession(session: BreathingSessionInput): Promise<void> {
  const s = resolveSession(session)
  await syncUpsert(() => dbSave(s), {
    local_id: s.id,
    module_id: MODULE_ID,
    entry_kind: 'breathing_session',
    client_created_at: s.started_at,
    payload: {
      technique_key: s.technique_key,
      started_at: s.started_at,
      duration_seconds: s.duration_seconds,
      planned_duration_seconds: s.planned_duration_seconds,
      cycles_completed: s.cycles_completed,
      completed: s.completed,
      feeling: s.feeling,
    },
  })
}

/** Config du module pour ce patient (lecture locale ; défauts si vierge). */
export async function fetchBreathingSettings(): Promise<BreathingSettings> {
  return dbGetSettings()
}

/** Écrit la config localement puis la synchronise (entrée unique, local_id stable). */
export async function saveBreathingSettings(settings: BreathingSettings): Promise<void> {
  await syncUpsert(() => dbSaveSettings(settings), {
    local_id: SETTINGS_LOCAL_ID,
    module_id: MODULE_ID,
    entry_kind: 'breathing_setting',
    payload: { ...settings },
  })
}
