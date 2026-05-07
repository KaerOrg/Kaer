import { supabase } from '../lib/supabase'
import type {
  Database,
  ModuleType,
  PatientModule,
  PsychoeducationCardEntry,
} from '../lib/database.types'

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
  cardIds: Iterable<string>
): Promise<{ ok: boolean }> {
  const now = new Date().toISOString()
  const cards: PsychoeducationCardEntry[] = [...cardIds].map(card_id => ({
    card_id,
    is_read: false,
    unlocked_at: now,
  }))
  const insertRow: Database['public']['Tables']['patient_modules']['Insert'] = {
    patient_id: patientId,
    practitioner_id: practitionerId,
    module_type: 'psychoeducation',
    config: { unlocked_cards: cards } as Record<string, unknown>,
  }
  const { error } = await supabase.from('patient_modules').insert(insertRow)
  return { ok: !error }
}

export async function updatePsychoeducationCards(
  moduleId: string,
  existing: PsychoeducationCardEntry[],
  cardIds: Iterable<string>
): Promise<{ ok: boolean }> {
  const now = new Date().toISOString()
  const existingById: Record<string, PsychoeducationCardEntry> = Object.fromEntries(
    existing.map(c => [c.card_id, c])
  )
  const cards: PsychoeducationCardEntry[] = [...cardIds].map(card_id =>
    existingById[card_id] ?? { card_id, is_read: false, unlocked_at: now }
  )
  const update: Database['public']['Tables']['patient_modules']['Update'] = {
    config: { unlocked_cards: cards } as Record<string, unknown>,
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

/** Pour le dispensaire : assigne un questionnaire à un patient. */
export async function proposeScale(
  patientId: string,
  practitionerId: string,
  scaleId: string
): Promise<{ ok: boolean; code?: string }> {
  return unlockModule(patientId, practitionerId, scaleId as ModuleType, {})
}
