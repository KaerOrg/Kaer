// Types partagés entre l'app web (praticien) et l'app mobile (patient)

export { logger } from './logger'

export { colors, spacing, radius, fontSize } from './theme'

export { fetchModuleFields } from './services/moduleFields'

export { collectIndexed } from './services/fieldProps'

export { readEnabledGroups } from './services/patientModuleConfig'

export { collectRenderMismatches, RENDERABLE_WIDGET_TYPES } from './services/renderDiagnostics'
export type { RenderMismatchDescriptor } from './services/renderDiagnostics'

export {
  buildRhythmogram,
  parseTimeToMinutes,
  circularSdMinutes,
  minutesToHourLabel,
  minutesToClock,
} from './services/rhythmogram'
export type { RhythmEntry, RhythmAnchorStat, RhythmogramResult } from './services/rhythmogram'
export { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS } from './services/chronoAnchors'
export type { ChronoAnchorSpec } from './services/chronoAnchors'

export type UserRole = 'practitioner' | 'patient'

export type ModuleType =
  // Sécurité & Gestion de Crise
  | 'crisis_plan'
  | 'therapeutic_commitment'
  | 'distress_tolerance'
  // Surveillance Iatrogénique & Somatique
  | 'medication_side_effects'
  | 'medication_adherence'
  | 'psychoeducation'
  // Hygiène de Vie & Rythmes Biologiques
  | 'sleep_diary'
  | 'chronobiology_tracker'
  // Régulation Émotionnelle & Humeur
  | 'mood_tracker'
  | 'emotion_wheel'
  | 'behavioral_activation'
  // Restructuration Cognitive
  | 'beck_columns'
  | 'cognitive_distortions'
  | 'grounding'
  | 'rim'
  // Anxiété, Phobies & TOC
  | 'fear_thermometer'
  | 'exposure_hierarchy'
  | 'breathing_techniques'
  | 'cognitive_saturation'
  // Addictologie & Impulsivité
  | 'craving_journal'
  | 'decisional_balance'
  // Entretien Motivationnel
  | 'motivational_balance'
  // Échelles & Questionnaires cliniques
  | 'phq9'
  | 'gad7'
  | 'epds'
  | 'rcads'
  | 'bsl23'
  | 'cape42'
  | 'audit'

export interface Module {
  id: string
  type: ModuleType
  name: string
  description: string
  unlockedAt: string
  config?: ModuleConfig
}

// Entrée d'observance pour une carte de psychoéducation
export interface PsychoeducationCardEntry {
  card_id: string
  is_read: boolean
  unlocked_at: string // ISO 8601
}

export interface CrisisPlanCopingCard {
  id: string
  thought: string
  response: string
}

// Observance médicamenteuse — une molécule du traitement du patient.
// `kind` distingue le traitement de fond (pris en continu) du « si besoin » (PRN).
// Donnée co-éditée patient↔praticien, stockée dans `patient_modules.config.medications`.
export type MedicationKind = 'maintenance' | 'prn'

export interface Medication {
  readonly id: string
  readonly name: string
  readonly posology: string
  readonly kind: MedicationKind
}

export interface ModuleConfig {
  // Agenda du sommeil
  sleepDiary?: {
    notificationTime?: string // ex: "21:00"
  }
  // Thermomètre de la peur
  fearThermometer?: {
    maxLevel?: number
    customLabels?: string[]
  }
  // Psychoéducation — liste des cartes débloquées avec suivi de lecture
  psychoeducation?: {
    unlocked_cards: PsychoeducationCardEntry[]
  }
  // Plan de crise — contenu co-construit par le praticien
  crisisPlan?: {
    practitionerMessage?: string
    copingCards?: CrisisPlanCopingCard[]
    commitmentPhrase?: string
  }
  // Observance médicamenteuse — liste de molécules co-éditée patient↔praticien
  medicationAdherence?: {
    medications: Medication[]
  }
}

export interface PatientModule {
  id: string
  patientId: string
  moduleType: ModuleType
  unlockedAt: string
  config: ModuleConfig
}

// Module rendering — partagé entre web (preview praticien) et mobile (rendu patient).
// La colonne `modules.preview_kind` en base pilote le moteur de rendu.
//
// Source UNIQUE des preview_kind connus : le tableau `PREVIEW_KINDS` (valeur runtime)
// dont dérive le type `PreviewKind`. Le moteur d'observabilité (issue #90) et la garde
// CI confrontent les `preview_kind` des seeds à ce même tableau — pas de duplication
// type/runtime possible. Tout `preview_kind` en base hors de cette liste est un orphelin.
export const PREVIEW_KINDS = [
  'coming_soon',
  'steps',
  'editable_steps',
  'cards',
  'fields',
  'questionnaire',
  'guided_exercise',
  'patient_scenario',
  'daily_checkin',
  'medication_tracker',
  'column_form',
  'tree_selector',
  'sleep_journal',
  'activity_log',
  'exposure_tracker',
  'decision_grid',
  'psyedu',
  'psyedu_library',
  'tabbed',
  'chrono_month',
  'slider_dashboard',
  'crisis_urgency',
  'crisis_companion',
  'stage_wheel',
  'dual_ruler',
  'weighted_balance',
  'breathing_pacer',
] as const

export type PreviewKind = (typeof PREVIEW_KINDS)[number]

// Layouts dont le contenu provient d'une autre source que `module_content_fields`
// (psyedu_topics/psyedu_blocks, ou SQLite côté mobile pour motivational_balance) :
// ils rendent légitimement avec 0 field. Source unique partagée par les deux
// LayoutDispatcher (web + mobile) ET la garde CI — un rendu vide ici n'est PAS un
// orphelin et ne déclenche aucune alerte (issue #90).
export const FIELDLESS_LAYOUTS: ReadonlySet<PreviewKind> = new Set<PreviewKind>([
  'psyedu',
  'psyedu_library',
  'chrono_month',
  'stage_wheel',
  'dual_ruler',
  'weighted_balance',
])

// ─── Observabilité du moteur de rendu (issue #90) ────────────────────────────
// Télémétrie TECHNIQUE d'un non-match de config (preview_kind / field_type /
// widget_type / text_code orphelin). ZÉRO donnée patient : uniquement de la config
// structurelle. Hors périmètre MDR (aucune saisie, aucun identifiant patient).

export type RenderMismatchLevel =
  | 'preview_kind'
  | 'field_type'
  | 'widget_type'
  | 'missing_text_code'

// Payload envoyé par les apps à l'edge function `report-render-mismatch`.
// Aucun champ ne porte de donnée patient (pas de payload de saisie, pas d'id patient).
export interface RenderMismatch {
  platform: 'web' | 'mobile'
  app_version: string
  level: RenderMismatchLevel
  module_id: string | null
  preview_kind: string | null
  field_id: string | null
  field_type: string | null
  widget_type: string | null
  reason: string
}

// Une ligne hydratée de `module_content_fields` + ses `field_props` agrégés et ses enfants.
export interface ContentField {
  id: string
  module_id: string
  section_id: string | null
  parent_field_id: string | null
  field_type: string
  text_code: string | null
  sort_order: number
  props: Record<string, string>
  children: ContentField[]
}

export interface ModuleFieldsResult {
  preview_kind: PreviewKind
  fields: ContentField[]
}

// ─── Psychoéducation structurée (contenu en base — psyedu_topics + psyedu_blocks) ───────────

// Thème de la bibliothèque psychoéducation (psyedu_themes).
// Libellé via i18n : psyedu.theme.<id>.
export interface PsyEduTheme {
  readonly id: string
  readonly icon_name: string
  readonly sort_order: number
}

export interface PsyEduTopic {
  readonly id: string
  // Refonte : une fiche est découplée du module — elle appartient à un thème
  // (theme_id) et peut être réutilisée par N modules via module_topics.
  // module_key conservé (nullable) le temps de la transition.
  readonly module_key: string | null
  readonly theme_id: string | null
  readonly topic_key: string
  readonly icon_name: string
  readonly sort_order: number
  readonly is_active: boolean
  readonly reviewed_at: string | null
}

export type PsyEduBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullet_list'
  | 'action_list'
  | 'tip'
  | 'blockquote'
  | 'source_link'

export type PsyEduSectionKey = 'why' | 'how' | 'sources'

export interface PsyEduBlock {
  readonly id: string
  readonly topic_id: string
  readonly section_key: PsyEduSectionKey
  readonly block_type: PsyEduBlockType
  readonly text_code: string | null
  readonly items_codes: string[] | null
  readonly href: string | null
  readonly sort_order: number
}

// ─── Sources et recommandations (module_sources) ──────────────────────────────

export type ModuleSourceType =
  | 'rct'
  | 'cohort_study'
  | 'meta_analysis'
  | 'systematic_review'
  | 'guideline'
  | 'expert_opinion'

export interface ModuleSource {
  readonly id: string
  readonly module_id: string
  readonly label: string
  readonly source_type: ModuleSourceType
  readonly url: string | null
  readonly evidence_grade: 'A' | 'B' | 'C' | null
  readonly description: string | null
  readonly sort_order: number
}
