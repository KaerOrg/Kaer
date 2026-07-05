import { supabase } from '../lib/supabase'
import type { RhythmEntry } from '@kaer/shared'

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

// Résumé brut d'un module pour la card praticien : date et payload de la
// dernière saisie + nombre total d'entrées. Aucune interprétation (MDR).
export type ModuleSummary = {
  lastDate: string | null
  count: number
  lastPayload: Record<string, unknown> | null
}

// Activité du module behavioral_activation, telle que saisie par le patient.
// P/M attendus (prédiction à la planification) et ressentis (après réalisation)
// sont des valeurs brutes 0-10, nullables : « non renseigné » est un état légitime.
export type ActivityEntryPoint = {
  id: string
  date: string // YYYY-MM-DD — date métier de l'activité (payload.date), pas la date de sync
  label: string
  done: boolean
  expected_pleasure: number | null
  expected_mastery: number | null
  pleasure: number | null
  mastery: number | null
  planned_time: string | null // HH:MM
  domain_id: string | null
  notes: string | null
}

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

// ── Évolution de l'agenda du sommeil (métriques cliniques calculées) ─────────
// Point par nuit (payload.date). Conforme MDR : valeurs brutes / calculées pour
// le praticien, aucune interprétation. Calculs alignés Consensus Sleep Diary.

export type SleepPoint = {
  date: string                       // nuit enregistrée (payload.date, YYYY-MM-DD)
  efficiency: number | null          // SE % = TST / TPL
  total_sleep_min: number | null     // TST en minutes
  onset_min: number                  // latence (SOL)
  waso_min: number                   // durée des réveils (WASO)
  in_bed_time: string | null
  bedtime: string | null
  wake_time: string | null
  out_of_bed_time: string | null
  nightmares: boolean
}

function readStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

// Minutes entre deux horaires HH:MM (gère le passage à minuit). null si invalide.
function spanMinutes(start: string, end: string): number | null {
  const [sH, sM] = start.split(':').map(Number)
  const [eH, eM] = end.split(':').map(Number)
  if ([sH, sM, eH, eM].some(n => Number.isNaN(n))) return null
  const raw = eH * 60 + eM - (sH * 60 + sM)
  return raw < 0 ? raw + 24 * 60 : raw
}

export async function fetchSleepEvolution(patientId: string): Promise<SleepPoint[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'sleep_diary_entry')
    .eq('module_id', 'sleep_diary')
    .order('client_created_at')

  if (error || !data) return []
  const points: SleepPoint[] = []
  for (const row of data) {
    const p = row.payload
    const date = readStr(p.date)
    if (date == null) continue
    const bedtime = readStr(p.bedtime)
    const wakeTime = readStr(p.wake_time)
    const inBed = readStr(p.in_bed_time)
    const outBed = readStr(p.out_of_bed_time)
    const onset = toNumber(p.sleep_onset_minutes) ?? 0
    const waso = toNumber(p.awakenings_duration_minutes) ?? 0

    let totalSleep: number | null = null
    let efficiency: number | null = null
    if (bedtime && wakeTime) {
      const sleepWindow = spanMinutes(bedtime, wakeTime)
      if (sleepWindow != null && sleepWindow > 0) {
        totalSleep = Math.max(0, sleepWindow - onset - waso)
        const tib = inBed && outBed ? spanMinutes(inBed, outBed) : sleepWindow
        if (tib != null && tib > 0) {
          efficiency = Math.min(100, Math.round((totalSleep / tib) * 100))
        }
      }
    }

    points.push({
      date,
      efficiency,
      total_sleep_min: totalSleep,
      onset_min: onset,
      waso_min: waso,
      in_bed_time: inBed,
      bedtime,
      wake_time: wakeTime,
      out_of_bed_time: outBed,
      nightmares: toNumber(p.nightmares) === 1,
    })
  }
  // Tri par nuit enregistrée (payload.date), pas par horodatage de saisie.
  points.sort((a, b) => a.date.localeCompare(b.date))
  return points
}

// ── Résumé brut d'un module (toutes entrées confondues) ──────────────────────
// Filtre par module_id seul : tous les entry_kind du module sont comptés.
// Restitution neutre conforme MDR — date, compte et payload brut, sans jugement.

export async function fetchModuleSummary(
  patientId: string,
  moduleType: string,
): Promise<ModuleSummary> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('module_id', moduleType)
    .order('client_created_at', { ascending: false })

  if (error || !data || data.length === 0) {
    return { lastDate: null, count: 0, lastPayload: null }
  }

  return {
    lastDate: data[0].client_created_at,
    count: data.length,
    lastPayload: data[0].payload,
  }
}

// ── Rythmes « Rythmes & régularité » (vue praticien) ──────────────────────────
// Horaires bruts de chaque repère, datés, pour tracer le rythmogramme (heure du
// repère jour par jour). Valeurs BRUTES, aucune interprétation ni seuil
// (MDR 2017/745). La date d'une saisie = client_created_at (le patient peut la
// dater rétroactivement → ce champ porte le jour concerné).

export async function fetchChronoEntries(patientId: string): Promise<RhythmEntry[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('payload, client_created_at')
    .eq('patient_id', patientId)
    .eq('module_id', 'chronobiology_tracker')
    .eq('entry_kind', 'form_entry')
    .order('client_created_at', { ascending: true })

  if (error || !data) return []

  const entries: RhythmEntry[] = []
  for (const row of data) {
    const date = typeof row.client_created_at === 'string' ? row.client_created_at.slice(0, 10) : null
    const payload = row.payload as { values?: Record<string, string | null> } | null
    if (date && payload && typeof payload === 'object' && payload.values && typeof payload.values === 'object') {
      entries.push({ date, values: payload.values })
    }
  }

  return entries
}

// ── Activités « Activation comportementale » (vue praticien) ─────────────────
// Restitution brute des activités planifiées/réalisées avec leurs P/M attendus
// et ressentis, datées par payload.date (date métier choisie par le patient,
// jamais l'horodatage de sync). Aucune interprétation ni seuil (MDR 2017/745).
// Compat legacy (saisies antérieures à la refonte, sans champs expected_*) :
// planifiée → P/M lus comme attendus ; réalisée → P/M lus comme ressentis.

function readNullableScore(value: unknown): number | null {
  return toNumber(value) ?? null
}

export async function fetchActivityEntries(patientId: string): Promise<ActivityEntryPoint[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('local_id, payload')
    .eq('patient_id', patientId)
    .eq('module_id', 'behavioral_activation')
    .eq('entry_kind', 'activity_record')

  if (error || !data) return []

  const points: ActivityEntryPoint[] = []
  for (const row of data) {
    const p = row.payload as Record<string, unknown>
    const date = typeof p.date === 'string' ? p.date : null
    const label = typeof p.label === 'string' ? p.label : null
    if (date == null || label == null) continue

    const done = toNumber(p.done) === 1
    const isLegacy = !('expected_pleasure' in p)
    const pleasure = readNullableScore(p.pleasure)
    const mastery = readNullableScore(p.mastery)

    points.push({
      id: row.local_id,
      date,
      label,
      done,
      expected_pleasure: isLegacy ? (done ? null : pleasure) : readNullableScore(p.expected_pleasure),
      expected_mastery: isLegacy ? (done ? null : mastery) : readNullableScore(p.expected_mastery),
      pleasure: isLegacy && !done ? null : pleasure,
      mastery: isLegacy && !done ? null : mastery,
      planned_time: readStr(p.planned_time),
      domain_id: readStr(p.domain_id),
      notes: readStr(p.notes),
    })
  }
  // Tri par date métier puis heure prévue, pas par horodatage de sync.
  points.sort((a, b) => a.date.localeCompare(b.date) || (a.planned_time ?? '').localeCompare(b.planned_time ?? ''))
  return points
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
