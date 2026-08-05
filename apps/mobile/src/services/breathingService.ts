import {
  saveBreathingSession as dbSave,
  getAllBreathingSessions as dbGetAll,
  getBreathingSettings as dbGetSettings,
  saveBreathingSettings as dbSaveSettings,
  type BreathingAmbientSound,
  type BreathingFeeling,
  type BreathingSession,
  type BreathingSessionInput,
  type BreathingSettings,
} from '../lib/database'
import { collectIndexed, type ContentField } from '@kaer/shared'
import { fetchModuleFields } from './moduleService'
import { syncUpsert } from './syncHelpers'

export type {
  BreathingAmbientSound, BreathingFeeling, BreathingSession, BreathingSessionInput, BreathingSettings,
}

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
  // Filtrer sur le type : une technique porte aussi des enfants `technique_info`
  // (« En savoir plus », M6), qui ne sont pas des phases.
  const phases = field.children
    .filter((child) => child.field_type === 'breathing_phase')
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

// ─── Activation praticien (epic #195) ────────────────────────────────────────

/** Config du module lue en base (field `bt.config`), et non figée en TypeScript. */
export interface BreathingModuleConfig {
  /** Technique activée par défaut tant que le praticien n'en a activé aucune. */
  defaultTechniqueKey: string | null
  /** Durées proposées avant une session, en minutes, dans l'ordre d'affichage. */
  durationsMin: number[]
  /** Ambiances sonores proposées, dans l'ordre d'affichage. */
  ambientSounds: BreathingAmbientSound[]
}

/** Ambiances déclarées en base (`check` sur `breathing_settings.ambient_sound_key`). */
const AMBIENT_SOUNDS: readonly BreathingAmbientSound[] = ['river', 'waves', 'rain', 'wind', 'bowl']

function isAmbientSound(value: string): value is BreathingAmbientSound {
  return (AMBIENT_SOUNDS as readonly string[]).includes(value)
}

/**
 * Lit la config du module depuis ses fields. Pure : partagée par le hub (qui reçoit
 * déjà les fields) et tout appelant qui les a chargés.
 *
 * Les listes viennent de clés indexées atomiques (`duration_1`, `ambient_sound_1`…),
 * jamais d'une valeur packée en CSV. Une ambiance inconnue de l'énumération est
 * écartée plutôt que propagée : la colonne en base la refuserait à l'écriture.
 */
export function breathingConfigFromFields(fields: ContentField[]): BreathingModuleConfig {
  const config = fields.find((f) => f.field_type === 'exercise_config')
  const props = config?.props ?? {}
  return {
    defaultTechniqueKey: props.default_technique_key ?? null,
    durationsMin: collectIndexed(props, 'duration').map(Number).filter((min) => min > 0),
    ambientSounds: collectIndexed(props, 'ambient_sound').filter(isAmbientSound),
  }
}

// ─── « En savoir plus » (epic #195, M6) ──────────────────────────────────────

/** Où s'affiche un bloc : d'emblée, ou dans la section repliée des références. */
export type TechniqueInfoSection = 'body' | 'sources'

/** Un bloc de la feuille « En savoir plus », déclaré en base. */
export interface TechniqueInfoBlock {
  id: string
  /** Clé i18n du titre du bloc. `null` quand le bloc n'en porte pas. */
  labelCode: string | null
  /** Clé i18n du texte du bloc. */
  textCode: string
  section: TechniqueInfoSection
}

/**
 * Blocs « En savoir plus » d'une technique, dans l'ordre déclaré en base.
 *
 * Le contenu vit dans `module_content_fields` (enfants `technique_info`), pas dans
 * le code : ajouter un paragraphe à une technique est un INSERT, pas un
 * déploiement. Le composant reçoit des clés i18n, il n'en dérive aucune lui-même.
 *
 * Pure : aucun I/O.
 */
export function techniqueInfoFromFields(
  fields: ContentField[],
  techniqueKey: string,
): TechniqueInfoBlock[] {
  const technique = fields.find(
    (f) => f.field_type === 'breathing_technique' && f.props.technique_key === techniqueKey,
  )
  if (technique == null) return []

  const ordered = [...technique.children].sort((a, b) => a.sort_order - b.sort_order)
  const blocks: TechniqueInfoBlock[] = []
  for (const child of ordered) {
    if (child.field_type !== 'technique_info') continue
    // Un bloc sans `text_code` n'a rien à afficher : on l'ignore plutôt que de rendre
    // une clé vide. Lu dans une variable pour que le typage suive, sans cast.
    const textCode = child.text_code
    if (textCode == null) continue
    blocks.push({
      id: child.id,
      labelCode: child.props.info_label ?? null,
      textCode,
      section: child.props.info_section === 'sources' ? 'sources' : 'body',
    })
  }
  return blocks
}

/** Ce que le patient voit : sa technique de séance, et les autres techniques activées. */
export interface BreathingActivation {
  /** Technique « travaillée en séance ». `null` si aucune technique n'est disponible. */
  primary: BreathingTechnique | null
  /** Les autres techniques activées, hors `primary`, dans l'ordre de la config. */
  others: BreathingTechnique[]
}

/**
 * Résout ce que le patient a le droit de voir : **uniquement** les techniques
 * activées par son praticien. Aucune technique non activée n'est jamais renvoyée,
 * sous aucune forme (ni verrouillée, ni en teaser).
 *
 * Repli tant que l'écran praticien web (W0) n'existe pas : quand
 * `enabled_techniques` est vide (le praticien n'a rien activé ; le patient, lui,
 * ne peut pas y toucher depuis l'app), on retombe sur la technique par défaut
 * déclarée en base (`bt.config.default_technique_key`).
 *
 * Pure : aucun I/O, testable directement.
 */
export function resolveActivation(
  techniques: BreathingTechnique[],
  settings: BreathingSettings,
  config: BreathingModuleConfig,
): BreathingActivation {
  const enabledKeys = settings.enabled_techniques.length > 0
    ? settings.enabled_techniques
    : config.defaultTechniqueKey != null ? [config.defaultTechniqueKey] : []

  const allowed = new Set(enabledKeys)
  // On filtre `techniques` (et non `enabledKeys`) pour conserver l'ordre de la
  // config et écarter une clé activée qui n'existerait plus en base.
  const enabled = techniques.filter((tech) => allowed.has(tech.key))

  const primaryKey = settings.primary_technique ?? config.defaultTechniqueKey
  const primary = enabled.find((tech) => tech.key === primaryKey) ?? enabled[0] ?? null

  return {
    primary,
    others: enabled.filter((tech) => tech !== primary),
  }
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
