import { supabase } from '../lib/supabase'

export type ScorePoint = { date: string; score: number }

export type MoodPoint = {
  date: string
  humeur?: number
  energie?: number
  anxiete?: number
  plaisir?: number
  sommeil?: number
  alimentation?: number
}

export type FearPoint = { date: string; suds_before: number; suds_after: number }

export type MedEffectPoint = { date: string; [key: string]: number | string }

// Modules d'échelles graphés par le praticien (lecture depuis patient_entries).
const SCALE_MODULES = [
  'phq9', 'gad7', 'bsl23', 'epds', 'rcads', 'asrs6', 'snap_iv', 'nsi',
] as const

const MOOD_DIMENSIONS = [
  'humeur', 'energie', 'anxiete', 'plaisir', 'sommeil', 'alimentation',
] as const

// ── Helpers de lecture du payload (jsonb opaque côté serveur) ────────────────
// Le payload est `Record<string, unknown>` : on coerce défensivement vers number,
// jamais d'interprétation clinique — on relaie la valeur brute saisie.

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function readSubscores(payload: Record<string, unknown>): Record<string, unknown> {
  const subs = payload.subscale_scores
  return subs != null && typeof subs === 'object' ? (subs as Record<string, unknown>) : {}
}

// ── Évolution des échelles (score total) ─────────────────────────────────────

export async function fetchScaleEvolution(
  patientId: string,
  moduleType: string,
): Promise<ScorePoint[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'scale_entry')
    .eq('module_id', moduleType)
    .order('client_created_at')

  if (error || !data) return []
  const points: ScorePoint[] = []
  for (const row of data) {
    const score = toNumber(row.payload.total_score)
    if (score != null) points.push({ date: row.client_created_at, score })
  }
  return points
}

// ── Évolution de l'humeur (6 dimensions dans subscale_scores) ────────────────

export async function fetchMoodEvolution(patientId: string): Promise<MoodPoint[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'scale_entry')
    .eq('module_id', 'mood_tracker')
    .order('client_created_at')

  if (error || !data) return []
  const points: MoodPoint[] = []
  for (const row of data) {
    const subs = readSubscores(row.payload)
    const point: MoodPoint = { date: row.client_created_at }
    let hasValue = false
    for (const dim of MOOD_DIMENSIONS) {
      const value = toNumber(subs[dim])
      if (value != null) {
        point[dim] = value
        hasValue = true
      }
    }
    if (hasValue) points.push(point)
  }
  return points
}

// ── Évolution du thermomètre de la peur (SUDS avant/après) ───────────────────

export async function fetchFearEvolution(patientId: string): Promise<FearPoint[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'fear_entry')
    .eq('module_id', 'fear_thermometer')
    .order('client_created_at')

  if (error || !data) return []
  const points: FearPoint[] = []
  for (const row of data) {
    const before = toNumber(row.payload.suds_before)
    if (before == null) continue
    points.push({
      date: row.client_created_at,
      suds_before: before,
      suds_after: toNumber(row.payload.suds_after) ?? 0,
    })
  }
  return points
}

// ── Évolution des effets indésirables (subscores dynamiques) ─────────────────

export async function fetchMedSideEffectsEvolution(patientId: string): Promise<{
  effects: string[]
  data: MedEffectPoint[]
}> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'scale_entry')
    .eq('module_id', 'medication_side_effects')
    .order('client_created_at')

  if (error || !data) return { effects: [], data: [] }

  const effectKeys = new Set<string>()
  const points: MedEffectPoint[] = []

  for (const row of data) {
    const subs = readSubscores(row.payload)
    const point: MedEffectPoint = { date: row.client_created_at }
    let hasValue = false
    for (const [key, raw] of Object.entries(subs)) {
      const value = toNumber(raw)
      if (value != null) {
        effectKeys.add(key)
        point[key] = value
        hasValue = true
      }
    }
    if (hasValue) points.push(point)
  }

  return { effects: [...effectKeys], data: points }
}

// ── Liste des échelles disponibles pour ce patient ───────────────────────────

export async function fetchAvailableScales(patientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('module_id')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'scale_entry')

  if (error || !data) return []

  const found = new Set<string>()
  for (const row of data) {
    if ((SCALE_MODULES as readonly string[]).includes(row.module_id)) found.add(row.module_id)
  }
  return [...found]
}
