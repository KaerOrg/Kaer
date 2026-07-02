import { supabase } from '../lib/supabase'
import type {
  Database,
  ModuleType,
  PatientModule,
  PsychoeducationTopicEntry,
} from '../lib/database.types'
import type { TrackedEffect } from '../lib/sideEffectsCatalog'
import type { BAConfiguredActivity, Medication } from '@kaer/shared'

export async function fetchPatientModules(patientId: string): Promise<PatientModule[]> {
  const { data } = await supabase.from('patient_modules').select('*').eq('patient_id', patientId)
  return data ?? []
}

export async function unlockModule(
  patientId: string,
  practitionerId: string,
  moduleType: ModuleType,
  config?: Record<string, unknown>
): Promise<{ ok: boolean; code?: string; message?: string }> {
  const insertRow: Database['public']['Tables']['patient_modules']['Insert'] = {
    patient_id: patientId,
    practitioner_id: practitionerId,
    module_type: moduleType,
    ...(config !== undefined ? { config: config as Record<string, unknown> } : {}),
  }
  const { error } = await (supabase.from('patient_modules') as unknown as {
    insert: (v: Record<string, unknown>) => Promise<{
      error: { code: string; message: string } | null
    }>
  }).insert(insertRow as Record<string, unknown>)
  if (error) return { ok: false, code: error.code, message: error.message }
  return { ok: true }
}

export async function revokeModule(moduleId: string): Promise<void> {
  await supabase.from('patient_modules').delete().eq('id', moduleId)
}

export async function unlockPsychoeducation(
  patientId: string,
  practitionerId: string,
  topicIds: Iterable<string>
): Promise<{ ok: boolean }> {
  const now = new Date().toISOString()
  const topics: PsychoeducationTopicEntry[] = [...topicIds].map(topic_id => ({
    topic_id,
    is_read: false,
    unlocked_at: now,
  }))
  const insertRow: Database['public']['Tables']['patient_modules']['Insert'] = {
    patient_id: patientId,
    practitioner_id: practitionerId,
    module_type: 'psychoeducation',
    config: { unlocked_topics: topics } as Record<string, unknown>,
  }
  const { error } = await supabase.from('patient_modules').insert(insertRow)
  return { ok: !error }
}

export async function updatePsychoeducationTopics(
  moduleId: string,
  existing: PsychoeducationTopicEntry[],
  topicIds: Iterable<string>
): Promise<{ ok: boolean }> {
  const now = new Date().toISOString()
  const existingById: Record<string, PsychoeducationTopicEntry> = Object.fromEntries(
    existing.map(e => [e.topic_id, e])
  )
  const topics: PsychoeducationTopicEntry[] = [...topicIds].map(topic_id =>
    existingById[topic_id] ?? { topic_id, is_read: false, unlocked_at: now }
  )
  const update: Database['public']['Tables']['patient_modules']['Update'] = {
    config: { unlocked_topics: topics } as Record<string, unknown>,
  }
  const { error } = await supabase.from('patient_modules').update(update).eq('id', moduleId)
  return { ok: !error }
}

export interface RimScenarioConfig {
  alternative: string
  original: string
}

export async function unlockRim(
  patientId: string,
  practitionerId: string,
  scenario: RimScenarioConfig
): Promise<{ ok: boolean }> {
  const config: Record<string, unknown> = { alternative_scenario: scenario.alternative }
  if (scenario.original) config.original_scenario = scenario.original
  const insertRow: Database['public']['Tables']['patient_modules']['Insert'] = {
    patient_id: patientId,
    practitioner_id: practitionerId,
    module_type: 'rim',
    config,
  }
  const { error } = await supabase.from('patient_modules').insert(insertRow)
  return { ok: !error }
}

export async function updateRim(
  moduleId: string,
  scenario: RimScenarioConfig
): Promise<{ ok: boolean }> {
  const config: Record<string, unknown> = { alternative_scenario: scenario.alternative }
  if (scenario.original) config.original_scenario = scenario.original
  const update: Database['public']['Tables']['patient_modules']['Update'] = { config }
  const { error } = await supabase.from('patient_modules').update(update).eq('id', moduleId)
  return { ok: !error }
}

// ── medication_side_effects ───────────────────────────────────────────────────

// Effets suivis configurés pour ce patient (config partagée praticien↔patient,
// dans patient_modules.config.tracked_effects). cf. lib/sideEffectsCatalog.
export async function fetchTrackedEffects(moduleId: string): Promise<TrackedEffect[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .maybeSingle()
  const cfg = (data?.config ?? {}) as Record<string, unknown>
  const tracked = cfg['tracked_effects']
  if (!Array.isArray(tracked)) return []
  return tracked as TrackedEffect[]
}

export async function updateTrackedEffects(
  moduleId: string,
  effects: TrackedEffect[],
): Promise<{ ok: boolean }> {
  const { data: current } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .maybeSingle()
  const existingConfig = (current?.config ?? {}) as Record<string, unknown>
  const update: Database['public']['Tables']['patient_modules']['Update'] = {
    config: { ...existingConfig, tracked_effects: effects },
  }
  const { error } = await supabase.from('patient_modules').update(update).eq('id', moduleId)
  return { ok: !error }
}

// ── medication_adherence — liste de molécules co-éditée patient↔praticien ──────

// Liste des médicaments (traitement de fond + si-besoin) configurée pour ce patient,
// dans patient_modules.config.medications. Éditable côté praticien (ici) ET patient (mobile).
export async function fetchMedications(moduleId: string): Promise<Medication[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .maybeSingle()
  const cfg = (data?.config ?? {}) as Record<string, unknown>
  const meds = cfg['medications']
  if (!Array.isArray(meds)) return []
  return meds as Medication[]
}

export async function updateMedications(
  moduleId: string,
  medications: Medication[],
): Promise<{ ok: boolean }> {
  const { data: current } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .maybeSingle()
  const existingConfig = (current?.config ?? {}) as Record<string, unknown>
  const update: Database['public']['Tables']['patient_modules']['Update'] = {
    config: { ...existingConfig, medications },
  }
  const { error } = await supabase.from('patient_modules').update(update).eq('id', moduleId)
  return { ok: !error }
}

// ── behavioral_activation — activités co-construites en consultation ───────────

// Activités personnalisées du patient (domaine de vie + phrase « valeur »),
// dans patient_modules.config.ba_activities. Définies avec le praticien en
// consultation (protocole BATD-R), lues par l'app mobile.
export async function fetchBAActivities(moduleId: string): Promise<BAConfiguredActivity[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .maybeSingle()
  const cfg = (data?.config ?? {}) as Record<string, unknown>
  const activities = cfg['ba_activities']
  if (!Array.isArray(activities)) return []
  return activities as BAConfiguredActivity[]
}

export async function updateBAActivities(
  moduleId: string,
  activities: BAConfiguredActivity[],
): Promise<{ ok: boolean }> {
  const { data: current } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .maybeSingle()
  const existingConfig = (current?.config ?? {}) as Record<string, unknown>
  const update: Database['public']['Tables']['patient_modules']['Update'] = {
    config: { ...existingConfig, ba_activities: activities },
  }
  const { error } = await supabase.from('patient_modules').update(update).eq('id', moduleId)
  return { ok: !error }
}
