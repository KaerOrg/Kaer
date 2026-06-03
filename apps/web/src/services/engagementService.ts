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

export type MedEffectPoint = { date: string } & Record<string, number>

const SCALE_MODULES = [
  'phq9', 'gad7', 'bsl23', 'epds', 'rcads', 'asrs6', 'snap_iv', 'nsi',
] as const

export async function fetchScaleEvolution(
  patientId: string,
  moduleType: string,
): Promise<ScorePoint[]> {
  const { data, error } = await supabase
    .from('patient_engagement_logs')
    .select('created_at, metadata')
    .eq('patient_id', patientId)
    .eq('event_type', 'SCALE_SUBMITTED')
    .filter('metadata->>module_type', 'eq', moduleType)
    .order('created_at')

  if (error || !data) return []
  return data
    .filter(row => row.metadata?.score != null)
    .map(row => ({ date: row.created_at as string, score: Number(row.metadata.score) }))
}

export async function fetchMoodEvolution(patientId: string): Promise<MoodPoint[]> {
  const { data, error } = await supabase
    .from('patient_engagement_logs')
    .select('created_at, metadata')
    .eq('patient_id', patientId)
    .eq('event_type', 'SAVE_MOOD_ENTRY')
    .order('created_at')

  if (error || !data) return []
  return data
    .filter(row => row.metadata?.humeur != null || row.metadata?.energie != null)
    .map(row => ({
      date: row.created_at as string,
      humeur:       row.metadata.humeur       != null ? Number(row.metadata.humeur)       : undefined,
      energie:      row.metadata.energie      != null ? Number(row.metadata.energie)      : undefined,
      anxiete:      row.metadata.anxiete      != null ? Number(row.metadata.anxiete)      : undefined,
      plaisir:      row.metadata.plaisir      != null ? Number(row.metadata.plaisir)      : undefined,
      sommeil:      row.metadata.sommeil      != null ? Number(row.metadata.sommeil)      : undefined,
      alimentation: row.metadata.alimentation != null ? Number(row.metadata.alimentation) : undefined,
    }))
}

export async function fetchFearEvolution(patientId: string): Promise<FearPoint[]> {
  const { data, error } = await supabase
    .from('patient_engagement_logs')
    .select('created_at, metadata')
    .eq('patient_id', patientId)
    .eq('event_type', 'SAVE_FEAR_ENTRY')
    .filter('metadata->>suds_before', 'not.is', null)
    .order('created_at')

  if (error || !data) return []
  return data
    .filter(row => row.metadata?.suds_before != null)
    .map(row => ({
      date: row.created_at as string,
      suds_before: Number(row.metadata.suds_before),
      suds_after:  Number(row.metadata.suds_after ?? 0),
    }))
}

export async function fetchMedSideEffectsEvolution(patientId: string): Promise<{
  effects: string[]
  data: MedEffectPoint[]
}> {
  const { data, error } = await supabase
    .from('patient_engagement_logs')
    .select('created_at, metadata')
    .eq('patient_id', patientId)
    .eq('event_type', 'SCALE_SUBMITTED')
    .filter('metadata->>module_type', 'eq', 'medication_side_effects')
    .order('created_at')

  if (error || !data) return { effects: [], data: [] }

  const effectKeys = new Set<string>()
  const points: MedEffectPoint[] = []

  for (const row of data) {
    const subscores = row.metadata?.subscores as Record<string, number> | undefined
    if (!subscores) continue
    Object.keys(subscores).forEach(k => effectKeys.add(k))
    points.push({ date: row.created_at as string, ...subscores })
  }

  return { effects: [...effectKeys], data: points }
}

export async function fetchAvailableScales(patientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('patient_engagement_logs')
    .select('metadata')
    .eq('patient_id', patientId)
    .eq('event_type', 'SCALE_SUBMITTED')

  if (error || !data) return []

  const found = new Set<string>()
  for (const row of data) {
    const mt = row.metadata?.module_type as string | undefined
    if (mt && (SCALE_MODULES as readonly string[]).includes(mt)) found.add(mt)
  }
  return [...found]
}
