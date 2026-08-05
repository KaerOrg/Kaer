import { supabase } from '../lib/supabase'
import type { RhythmEntry, BreathingSessionRow, BreathingFeelingValue } from '@kaer/shared'
import type { DefusionTechnique } from '../lib/defusionTechniques'
import { DEFUSION_TECHNIQUES } from '../lib/defusionTechniques'

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

// Un point = une exposition. `suds_peak` nullable (brouillon / non renseigné) ;
// `situation` = libellé de la marche, pour le filtre par situation de l'onglet Données.
export type FearPoint = {
  date: string
  suds_before: number
  suds_peak: number | null
  suds_after: number
  situation: string
}

// Une séance de défusion (« Décrocher d'une pensée »). Mesures inconfort/conviction
// avant·après, nullables PAR PAIRE (« Passer » saute une étape entière — MDR).
// `word` = mot/pensée travaillé (masqué par défaut côté praticien). `technique`
// distingue répétition de mot et distanciation. `duration_seconds` = 0 en distanciation.
export type DefusionPoint = {
  date: string
  technique: DefusionTechnique
  discomfort_before: number | null
  discomfort_after: number | null
  belief_before: number | null
  belief_after: number | null
  duration_seconds: number
  word: string
}

// Repère temporel (Life Chart) posé par le patient sur le mood_tracker (#161),
// lu par le praticien. Type en liste fermée ; `date` = jour métier du repère
// (payload.date), pas l'instant de sync. Aucune interprétation (contexte brut).
export type MoodMarkerType = 'treatment' | 'life_event' | 'other'
export type MoodMarkerRow = { id: string; date: string; label: string; type: MoodMarkerType }

export type MedEffectPoint = { date: string; [key: string]: number | string }

// Fiche d'un module `column_form` (payload { values }) : date + valeurs brutes
// saisies par le patient (textes libres et curseurs). Aucune interprétation (MDR).
export type FormEntryRow = { date: string; values: Record<string, string | number> }

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

// ── Repères temporels du mood_tracker (posés par le patient, #161) ───────────

function normalizeMarkerType(raw: unknown): MoodMarkerType {
  return raw === 'treatment' || raw === 'life_event' ? raw : 'other'
}

export async function fetchMoodMarkers(patientId: string): Promise<MoodMarkerRow[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('id, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'mood_marker')
    .eq('module_id', 'mood_tracker')
    .order('client_created_at')

  if (error || !data) return []
  const markers: MoodMarkerRow[] = []
  for (const row of data) {
    const date = typeof row.payload.date === 'string' ? row.payload.date : null
    const label = typeof row.payload.label === 'string' ? row.payload.label : ''
    if (date == null) continue
    markers.push({ id: row.id, date, label, type: normalizeMarkerType(row.payload.type) })
  }
  return markers
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
    const situation = typeof row.payload.situation_label === 'string' ? row.payload.situation_label : ''
    points.push({
      date: row.client_created_at,
      suds_before: before,
      suds_peak: toNumber(row.payload.suds_peak) ?? null,
      suds_after: toNumber(row.payload.suds_after) ?? 0,
      situation,
    })
  }
  return points
}

// ── Évolution de la défusion (« Décrocher d'une pensée », inconfort/conviction) ──

function toDefusionTechnique(value: unknown): DefusionTechnique {
  return DEFUSION_TECHNIQUES.find(technique => technique === value) ?? 'word_repetition'
}

export async function fetchDefusionEvolution(patientId: string): Promise<DefusionPoint[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'defusion_session')
    .eq('module_id', 'cognitive_saturation')
    .order('client_created_at')

  if (error || !data) return []
  const points: DefusionPoint[] = []
  for (const row of data) {
    points.push({
      date: row.client_created_at,
      technique: toDefusionTechnique(row.payload.technique),
      discomfort_before: toNumber(row.payload.discomfort_before) ?? null,
      discomfort_after: toNumber(row.payload.discomfort_after) ?? null,
      belief_before: toNumber(row.payload.belief_before) ?? null,
      belief_after: toNumber(row.payload.belief_after) ?? null,
      duration_seconds: toNumber(row.payload.duration_seconds) ?? 0,
      word: typeof row.payload.word_or_thought === 'string' ? row.payload.word_or_thought : '',
    })
  }
  return points
}

// ── Respiration : sessions brutes, non agrégées (W1 #373) ────────────────────
//
// Les sessions arrivent par la sync mobile dans `patient_entries`
// (`entry_kind = 'breathing_session'`), pas dans la table dédiée `breathing_sessions`
// qui n'est alimentée par personne (couture assumée, cf. schema.sql). Le service se
// contente de LIRE : les comptes vivent dans `@kaer/shared/breathingReport`.
//
// `client_created_at` porte l'instant métier de la session (le mobile y recopie
// `started_at`), ce qui place une session au bon jour même enregistrée plus tard.

function toFeeling(value: unknown): BreathingFeelingValue | null {
  return value === 'calmer' || value === 'same' || value === 'tenser' ? value : null
}

export async function fetchBreathingSessions(patientId: string): Promise<BreathingSessionRow[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'breathing_session')
    .eq('module_id', 'breathing_techniques')
    .order('client_created_at', { ascending: false })

  if (error || !data) return []

  const sessions: BreathingSessionRow[] = []
  for (const row of data) {
    const techniqueKey = row.payload.technique_key
    if (typeof techniqueKey !== 'string') continue
    const duration = toNumber(row.payload.duration_seconds) ?? 0
    sessions.push({
      // `started_at` du payload fait foi ; `client_created_at` couvre une entrée
      // ancienne écrite avant que le payload ne le porte.
      startedAt: typeof row.payload.started_at === 'string'
        ? row.payload.started_at
        : row.client_created_at,
      techniqueKey,
      durationSeconds: duration,
      plannedDurationSeconds: toNumber(row.payload.planned_duration_seconds) ?? duration,
      cyclesCompleted: toNumber(row.payload.cycles_completed) ?? 0,
      // Une entrée sans le champ est une session menée au bout (défaut du service
      // mobile) : seul un `false` explicite marque une interruption.
      completed: row.payload.completed !== false,
      feeling: toFeeling(row.payload.feeling),
    })
  }
  return sessions
}

// ── « Nommer ce que je ressens » : saisies brutes, non agrégées ───────────────
//
// Ce module ne produit pas de série numérique mais une catégorie (famille · nuance ·
// mot), une profondeur de choix, un contexte et un texte libre. Le service se contente
// donc de LIRE : les comptages descriptifs vivent dans `lib/emotionNamingData.ts`
// (fonctions pures testées), et la traduction des codes reste aux composants.

/** Une saisie du module, identités opaques (clés i18n) et valeurs brutes. */
export interface EmotionNamingRow {
  date: string
  familyCode: string | null
  nuanceCode: string | null
  wordCode: string | null
  intensity: number | null
  context: string[]
  contextOther: string | null
  notes: string | null
}

/** Élément du chemin persisté par le mobile : `{ id, text_code, color, icon }`. */
function pathCodeAt(payload: Record<string, unknown>, level: number): string | null {
  const path = payload.path
  if (!Array.isArray(path)) return null
  const node: unknown = path[level]
  if (typeof node !== 'object' || node === null) return null
  const code = (node as { text_code?: unknown }).text_code
  return typeof code === 'string' ? code : null
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export async function fetchEmotionNamingEntries(patientId: string): Promise<EmotionNamingRow[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('client_created_at, payload')
    .eq('patient_id', patientId)
    .eq('entry_kind', 'tree_selection')
    .eq('module_id', 'emotion_wheel')
    .order('client_created_at')

  if (error || !data) return []
  return data.map(row => ({
    date: row.client_created_at,
    // Un chemin vide est une entrée « sans mot » : légitime, jamais dégradée.
    familyCode: pathCodeAt(row.payload, 0),
    nuanceCode: pathCodeAt(row.payload, 1),
    wordCode: pathCodeAt(row.payload, 2),
    intensity: toNumber(row.payload.intensity) ?? null,
    context: toStringList(row.payload.context),
    contextOther: typeof row.payload.context_other === 'string' ? row.payload.context_other : null,
    notes: typeof row.payload.notes === 'string' ? row.payload.notes : null,
  }))
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
  waso_min: number                   // durée des réveils (WASO) — libellé praticien « Réveils nocturnes »
  nap_min: number                    // durée des siestes diurnes
  quality: number | null             // qualité ressentie 1 à 5 (saisie subjective)
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
    const nap = toNumber(p.nap_minutes) ?? 0
    const quality = toNumber(p.quality) ?? null

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
      nap_min: nap,
      quality,
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

// Dernière activité (date de la saisie la plus récente) de CHAQUE module du patient,
// pour la colonne « Dernière activité » du tableau des modules (K-1). Une seule
// requête pour tout le patient : on lit `module_id` + `client_created_at` triés du
// plus récent au plus ancien, puis on retient la première occurrence par module (donc
// la plus récente). Restitution BRUTE d'un horodatage, aucune interprétation (MDR).
export async function fetchModuleLastActivity(
  patientId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('module_id, client_created_at')
    .eq('patient_id', patientId)
    .order('client_created_at', { ascending: false })

  const lastByModule = new Map<string, string>()
  if (error || !data) return lastByModule

  for (const row of data) {
    // Données triées décroissant : la première ligne vue pour un module est sa plus
    // récente ; on ignore les suivantes.
    if (!lastByModule.has(row.module_id)) {
      lastByModule.set(row.module_id, row.client_created_at)
    }
  }
  return lastByModule
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

// ── Fiches des modules `column_form` (vue praticien) ─────────────────────────
// Restitution BRUTE des fiches saisies (textes et curseurs), triées par date de
// saisie croissante. La date = client_created_at (saisie rétroactive : ce champ
// porte le jour concerné). Aucune interprétation ni seuil (MDR 2017/745).

export async function fetchFormEntries(
  patientId: string,
  moduleId: string,
): Promise<FormEntryRow[]> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('payload, client_created_at')
    .eq('patient_id', patientId)
    .eq('module_id', moduleId)
    .eq('entry_kind', 'form_entry')
    .order('client_created_at', { ascending: true })

  if (error || !data) return []

  const entries: FormEntryRow[] = []
  for (const row of data) {
    if (typeof row.client_created_at !== 'string') continue
    const payload = row.payload as { values?: Record<string, unknown> } | null
    if (!payload || typeof payload !== 'object' || !payload.values || typeof payload.values !== 'object') continue
    // Validation de forme : seules les valeurs texte/nombre du payload opaque sont relayées.
    const values: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(payload.values)) {
      if (typeof value === 'string' || typeof value === 'number') values[key] = value
    }
    entries.push({ date: row.client_created_at, values })
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
