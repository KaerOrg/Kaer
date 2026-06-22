// Types de la « File active » — tour de contrôle praticien.
// Feature purement organisationnelle (cf. docs/spec/file-active.md).
// MDR : aucune donnée clinique structurée, aucune interprétation.

export type CaseloadStatus = 'active' | 'paused' | 'archived'

/** Niveau d'alerte CALCULÉ (jamais stocké) à partir des dates saisies par le praticien. */
export type AlertLevel = 'critical' | 'upcoming' | 'ok'

/** Un dossier de file active (le CONTEXTE). Les tâches vivent dans CaseloadAction. */
export interface CaseloadEntry {
  readonly id: string
  readonly practitioner_id: string
  readonly patient_id: string | null
  readonly display_name: string
  readonly status: CaseloadStatus
  readonly is_important: boolean
  readonly wake_date: string | null
  readonly invited_email: string | null
  readonly care_pathways: readonly string[]
  readonly last_reviewed_at: string | null
  readonly created_at: string
  readonly updated_at: string
  readonly archived_at: string | null
}

/** Champs modifiables d'un dossier (création / édition inline). */
export interface CaseloadEntryInput {
  display_name?: string
  patient_id?: string | null
  status?: CaseloadStatus
  is_important?: boolean
  wake_date?: string | null
  care_pathways?: string[]
  last_reviewed_at?: string | null
}

/** Une attente de retour (résultat de bilan, retour d'un pro, réponse ASE…) avec relance optionnelle. */
export interface CaseloadWait {
  readonly id: string
  readonly entry_id: string
  readonly practitioner_id: string
  readonly label: string
  readonly relance_date: string | null
  readonly created_at: string
  readonly updated_at: string
}

/** Champs modifiables d'une attente. */
export interface CaseloadWaitInput {
  label?: string
  relance_date?: string | null
}

/** Une tâche à faire d'un dossier. Chaque action a sa propre échéance (date + heure optionnelle) et sa coche « fait ». */
export interface CaseloadAction {
  readonly id: string
  readonly entry_id: string
  readonly practitioner_id: string
  readonly label: string
  readonly due_date: string | null
  readonly due_time: string | null
  readonly is_urgent: boolean
  readonly is_done: boolean
  readonly done_at: string | null
  readonly recurrence_days: number | null
  readonly sort_order: number
  readonly created_at: string
  readonly updated_at: string
}

/** Champs modifiables d'une action. */
export interface CaseloadActionInput {
  label?: string
  due_date?: string | null
  due_time?: string | null
  is_urgent?: boolean
  is_done?: boolean
  recurrence_days?: number | null
  sort_order?: number
}

/** Un dossier avec ses actions et ses attentes — l'unité affichée dans la matrice. */
export interface CaseloadRowData {
  readonly entry: CaseloadEntry
  readonly actions: readonly CaseloadAction[]
  readonly waits: readonly CaseloadWait[]
  /** Avatar du patient lié (`patients.avatar_url`) ; null si dossier non lié ou sans photo. */
  readonly patient_avatar_url: string | null
}

/** Une note du journal daté d'un dossier. */
export interface CaseloadNote {
  readonly id: string
  readonly entry_id: string
  readonly practitioner_id: string
  readonly body: string
  readonly is_pinned: boolean
  readonly created_at: string
}

/** Buckets de la vue « Aujourd'hui » (ordre d'affichage = ordre d'urgence). */
export type TodayBucket = 'overdue' | 'today' | 'relance' | 'wake'

/** Raison mécanique de présence dans la liste du jour — affichée à l'écran (transparence MDR). */
export type TodayReason =
  | { kind: 'overdue'; days: number }
  | { kind: 'due_today' }
  | { kind: 'relance_due'; label: string }
  | { kind: 'wake_due' }

/**
 * Un item de la vue « Aujourd'hui ». Pour les échéances d'action, `action` est
 * renseigné ; pour les relances / réveils (niveau dossier), `action` vaut null.
 */
export interface TodayItem {
  readonly entry: CaseloadEntry
  readonly action: CaseloadAction | null
  readonly bucket: TodayBucket
  readonly reason: TodayReason
}
